import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { lstat, mkdir, mkdtemp, readFile, readlink, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../bin/buildtrace.mjs", import.meta.url));
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

test("doctor validates the repository", () => {
  const result = spawnSync(process.execPath, [cli, "doctor"], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /BuildTrace doctor passed/);
  assert.match(result.stdout, /\d+ project records/);
});

test("init creates the portable package without overwriting existing files", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-init-"));
  try {
    const existingPath = join(target, "docs/buildtrace/BUILDTRACE.md");
    await mkdir(join(target, "docs/buildtrace"), { recursive: true });
    await writeFile(existingPath, "# Existing source\n");
    await writeFile(join(target, "AGENTS.md"), "# Existing agent rules\n");

    const result = spawnSync(process.execPath, [cli, "init", "--target", target, "--codex-home", join(target, "fake-codex-home")], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(await readFile(existingPath, "utf8"), "# Existing source\n");
    assert.match(await readFile(join(target, "docs/buildtrace/viewer/index.html"), "utf8"), /BuildTrace/);
    assert.match(await readFile(join(target, "bin/buildtrace.mjs"), "utf8"), /async function serve/);
    assert.match(await readFile(join(target, "docs/buildtrace/DEPLOY.md"), "utf8"), /先选择公开范围/);
    assert.match(await readFile(join(target, "docs/buildtrace/references/inspiration-and-attribution.md"), "utf8"), /Cline Memory Bank/);
    assert.match(await readFile(join(target, ".cursor/rules/buildtrace.mdc"), "utf8"), /Do not wait for fixed commands/);
    assert.equal(await readFile(join(target, "AGENTS.md"), "utf8"), "# Existing agent rules\n");
    const buildtraceAgentRules = await readFile(join(target, "AGENTS.md.buildtrace"), "utf8");
    assert.match(buildtraceAgentRules, /only project-memory source/);
    assert.match(buildtraceAgentRules, /Do not wait for fixed commands/);
    assert.match(result.stdout, /kept/);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("sync updates managed files with a backup and preserves project facts", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-sync-"));
  try {
    const initResult = spawnSync(process.execPath, [cli, "init", "--target", target, "--codex-home", join(target, "fake-codex-home")], { encoding: "utf8" });
    assert.equal(initResult.status, 0, initResult.stderr);
    const sourcePath = join(target, "docs/buildtrace/BUILDTRACE.md");
    const viewerPath = join(target, "docs/buildtrace/viewer/app.js");
    const projectSource = await readFile(sourcePath, "utf8");
    await writeFile(viewerPath, "// old viewer\n");
    await writeFile(join(target, ".buildtrace/.gitignore"), "custom-private/\n");

    const result = spawnSync(process.execPath, [cli, "sync", "--target", target], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /1 updated/);
    assert.match(result.stdout, /Project facts were not touched/);
    assert.equal(await readFile(sourcePath, "utf8"), projectSource);
    assert.match(await readFile(viewerPath, "utf8"), /resourceVault/);

    const backupRoot = join(target, ".buildtrace", "backups");
    const { readdir } = await import("node:fs/promises");
    const [backupName] = await readdir(backupRoot);
    assert.equal(await readFile(join(backupRoot, backupName, "docs/buildtrace/viewer/app.js"), "utf8"), "// old viewer\n");
    const privateIgnore = await readFile(join(target, ".buildtrace/.gitignore"), "utf8");
    assert.match(privateIgnore, /^custom-private\/$/m);
    assert.match(privateIgnore, /^backups\/$/m);
    assert.match(privateIgnore, /^recovery\/$/m);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("sync refuses to follow managed symlinks outside the target", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-sync-link-"));
  const external = join(tmpdir(), `buildtrace-sync-external-${Date.now()}.js`);
  try {
    const initResult = spawnSync(process.execPath, [cli, "init", "--target", target, "--codex-home", join(target, "fake-codex-home")], { encoding: "utf8" });
    assert.equal(initResult.status, 0, initResult.stderr);
    const viewerPath = join(target, "docs/buildtrace/viewer/app.js");
    await writeFile(external, "// outside target\n");
    await rm(viewerPath);
    await symlink(external, viewerPath);

    const result = spawnSync(process.execPath, [cli, "sync", "--target", target], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /refusing to replace managed symlink/);
    assert.equal(await readFile(external, "utf8"), "// outside target\n");
  } finally {
    await rm(target, { recursive: true, force: true });
    await rm(external, { force: true });
  }
});

test("recover refuses to follow private recovery symlinks outside the target", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-recover-link-"));
  const externalDirectory = await mkdtemp(join(tmpdir(), "buildtrace-recover-external-"));
  try {
    await mkdir(join(target, ".buildtrace"), { recursive: true });
    await symlink(externalDirectory, join(target, ".buildtrace/recovery"));

    const result = spawnSync(process.execPath, [cli, "recover", "--target", target, "--codex-home", join(target, "fake-codex-home")], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /refusing to use unsafe \.buildtrace\/recovery path/);
    await assert.rejects(readFile(join(externalDirectory, "latest.json")), { code: "ENOENT" });
  } finally {
    await rm(target, { recursive: true, force: true });
    await rm(externalDirectory, { recursive: true, force: true });
  }
});

test("deploy-kit creates a GitHub Pages workflow without overwriting it", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-deploy-"));
  try {
    const first = spawnSync(process.execPath, [cli, "deploy-kit", "--provider", "github-pages", "--target", target], { encoding: "utf8" });
    assert.equal(first.status, 0, first.stderr);
    const workflow = join(target, ".github/workflows/buildtrace-pages.yml");
    assert.match(await readFile(workflow, "utf8"), /docs\/buildtrace/);
    await writeFile(workflow, "# custom workflow\n");

    const second = spawnSync(process.execPath, [cli, "deploy-kit", "--provider", "github-pages", "--target", target], { encoding: "utf8" });
    assert.equal(second.status, 0, second.stderr);
    assert.equal(await readFile(workflow, "utf8"), "# custom workflow\n");
    assert.match(second.stdout, /kept/);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("install-codex-skill creates a live link without overwriting it", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-skill-"));
  const destination = join(target, "buildtrace");
  try {
    const first = spawnSync(
      process.execPath,
      [cli, "install-codex-skill", "--dest", destination],
      { encoding: "utf8" },
    );
    assert.equal(first.status, 0, first.stderr);

    assert.equal((await lstat(destination)).isSymbolicLink(), true);
    assert.equal(
      resolve(dirname(destination), await readlink(destination)),
      resolve(repoRoot, "docs/buildtrace"),
    );
    assert.match(await readFile(join(destination, "SKILL.md"), "utf8"), /name: buildtrace/);
    assert.match(await readFile(join(destination, "agents/openai.yaml"), "utf8"), /BuildTrace/);

    const second = spawnSync(
      process.execPath,
      [cli, "install-codex-skill", "--dest", destination],
      { encoding: "utf8" },
    );
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /already linked/);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("initialized CLI works inside a CommonJS project", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-commonjs-"));
  try {
    await writeFile(join(target, "package.json"), '{"type":"commonjs"}\n');
    const initResult = spawnSync(process.execPath, [cli, "init", "--target", target, "--codex-home", join(target, "fake-codex-home")], { encoding: "utf8" });
    assert.equal(initResult.status, 0, initResult.stderr);

    const installedCli = join(target, "bin/buildtrace.mjs");
    const agentRules = await readFile(join(target, "AGENTS.md"), "utf8");
    assert.match(agentRules, /only project-memory source/);
    assert.match(agentRules, /Do not wait for fixed commands/);
    assert.match(await readFile(join(target, ".cursor/rules/buildtrace.mdc"), "utf8"), /Do not wait for fixed commands/);
    const doctorResult = spawnSync(process.execPath, [installedCli, "doctor"], {
      cwd: target,
      encoding: "utf8",
    });
    assert.equal(doctorResult.status, 0, doctorResult.stderr);
    assert.match(doctorResult.stdout, /BuildTrace doctor passed/);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("doctor rejects records without evidence", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-invalid-"));
  try {
    const initResult = spawnSync(process.execPath, [cli, "init", "--target", target, "--codex-home", join(target, "fake-codex-home")], { encoding: "utf8" });
    assert.equal(initResult.status, 0, initResult.stderr);
    const sourcePath = join(target, "docs/buildtrace/BUILDTRACE.md");
    const source = await readFile(sourcePath, "utf8");
    await writeFile(sourcePath, source.replace(/^依据: BuildTrace init.*$/m, "依据:"));

    const doctorResult = spawnSync(process.execPath, [join(target, "bin/buildtrace.mjs"), "doctor"], {
      cwd: target,
      encoding: "utf8",
    });
    assert.notEqual(doctorResult.status, 0);
    assert.match(doctorResult.stdout, /依据 is required/);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("doctor supports target projects and legacy record dates while enforcing scene values", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-doctor-target-"));
  try {
    const initResult = spawnSync(process.execPath, [cli, "init", "--target", target, "--codex-home", join(target, "fake-codex-home")], { encoding: "utf8" });
    assert.equal(initResult.status, 0, initResult.stderr);
    const sourcePath = join(target, "docs/buildtrace/BUILDTRACE.md");
    const source = await readFile(sourcePath, "utf8");
    await writeFile(sourcePath, source.replace(/^### \d{4}-\d{2}-\d{2} —/m, "### 2026-07 —"));

    const validResult = spawnSync(process.execPath, [cli, "doctor", "--target", target], { encoding: "utf8" });
    assert.equal(validResult.status, 0, validResult.stderr);
    assert.match(validResult.stdout, /BuildTrace doctor passed/);

    const legacySource = await readFile(sourcePath, "utf8");
    await writeFile(sourcePath, legacySource.replace(/^场景: decision$/m, "场景: release-operations"));
    const invalidResult = spawnSync(process.execPath, [cli, "doctor", "--target", target], { encoding: "utf8" });
    assert.notEqual(invalidResult.status, 0);
    assert.match(invalidResult.stdout, /invalid 场景/);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("init creates an immediately readable project source", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-template-"));
  try {
    const result = spawnSync(process.execPath, [cli, "init", "--target", target, "--codex-home", join(target, "fake-codex-home")], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const source = await readFile(join(target, "docs/buildtrace/BUILDTRACE.md"), "utf8");
    assert.match(source, new RegExp(`^# ${basename(target)}$`, "m"));
    assert.match(source, /BuildTrace 初始化/);
    assert.match(source, /依据: BuildTrace init/);
    assert.doesNotMatch(source, /v1\.15 建立唯一主仓/);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("recover inventories matching Codex rollouts without duplicating transcript text", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-recover-project-"));
  const codexHome = await mkdtemp(join(tmpdir(), "buildtrace-recover-codex-"));
  try {
    await mkdir(join(target, ".buildtrace"), { recursive: true });
    await writeFile(join(target, ".buildtrace/.gitignore"), "custom-private/\n");
    const rolloutDirectory = join(codexHome, "sessions", "2026", "07", "19");
    await mkdir(rolloutDirectory, { recursive: true });
    const rollout = [
      { type: "session_meta", timestamp: "2026-07-19T00:00:00Z", payload: { id: "thread-test", cwd: target, source: "vscode", thread_source: "user", git: {} } },
      { type: "response_item", timestamp: "2026-07-19T00:00:01Z", payload: { type: "message", role: "user", id: "item-user-1", content: [{ type: "input_text", text: "private exact words" }] } },
      { type: "compacted", timestamp: "2026-07-19T00:00:02Z", payload: { replacement_history: [] } },
    ].map((row) => JSON.stringify(row)).join("\n");
    await writeFile(join(rolloutDirectory, "rollout-thread-test.jsonl"), `${rollout}\n`);
    await writeFile(join(rolloutDirectory, "rollout-thread-test-fork.jsonl"), `${rollout}\n`);

    const result = spawnSync(process.execPath, [cli, "recover", "--target", target, "--codex-home", codexHome], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /2 rollout sources, 1 unique Codex thread/);
    const manifestText = await readFile(join(target, ".buildtrace/recovery/latest.json"), "utf8");
    const manifest = JSON.parse(manifestText);
    assert.equal(manifest.coverage.codexLocalRollouts.matchedRolloutCount, 2);
    assert.equal(manifest.coverage.codexLocalRollouts.matchedThreadCount, 1);
    assert.equal(manifest.totals.exactUserMessages, 1);
    assert.equal(manifest.totals.exactUserMessageOccurrences, 2);
    assert.equal(manifest.totals.compactedWindows, 2);
    assert.equal(manifest.threads[0].messageRefs[0].id, "item-user-1");
    assert.doesNotMatch(manifestText, /private exact words/);
    assert.match(await readFile(join(target, ".buildtrace/.gitignore"), "utf8"), /recovery\//);
    assert.match(await readFile(join(target, ".buildtrace/.gitignore"), "utf8"), /custom-private\//);
  } finally {
    await rm(target, { recursive: true, force: true });
    await rm(codexHome, { recursive: true, force: true });
  }
});

test("export derives portable JSON and JSONL from the Markdown source", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-export-"));
  try {
    const initResult = spawnSync(process.execPath, [cli, "init", "--target", target, "--codex-home", join(target, "fake-codex-home")], { encoding: "utf8" });
    assert.equal(initResult.status, 0, initResult.stderr);

    const jsonResult = spawnSync(process.execPath, [cli, "export", "--target", target, "--format", "json"], { encoding: "utf8" });
    assert.equal(jsonResult.status, 0, jsonResult.stderr);
    const exported = JSON.parse(jsonResult.stdout);
    assert.equal(exported.schemaVersion, 3);
    assert.equal(exported.entries[0].recordId.startsWith("bt-"), true);
    assert.equal(exported.entries[0].sectionItems.summary.length >= 1, true);

    const jsonlResult = spawnSync(process.execPath, [cli, "export", "--target", target, "--format", "jsonl"], { encoding: "utf8" });
    assert.equal(jsonlResult.status, 0, jsonlResult.stderr);
    const rows = jsonlResult.stdout.trim().split("\n").map((line) => JSON.parse(line));
    assert.equal(rows[0].type, "project");
    assert.equal(rows[1].type, "record");
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("publish creates team and public snapshots without leaking private content or internal paths", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-publish-project-"));
  const publicOutput = join(tmpdir(), `buildtrace-public-${Date.now()}`);
  const teamOutput = join(tmpdir(), `buildtrace-team-${Date.now()}`);
  try {
    const initResult = spawnSync(process.execPath, [cli, "init", "--target", target, "--codex-home", join(target, "fake-codex-home")], { encoding: "utf8" });
    assert.equal(initResult.status, 0, initResult.stderr);
    const source = `# Privacy fixture

## 项目初心

- 为什么做这个项目: private purpose

## 项目入口 / 参考资料

- [admin] Internal admin: http://localhost:3000/admin

## 项目记录

### 2026-07-17 — Private only

记录 ID: bt-20260717-private
来源可信度: confirmed
来源覆盖: current-turn
关联任务: codex-thread/private
依据: /Users/example/private.txt
场景: decision
可见范围: private
结果状态: 不确定
后续回看: 无

沟通原文:
- [Q1 | user | codex-thread/private/item/1 | verbatim]
  > PRIVATE EXACT WORDS

需求总结:
- [R1 <- Q1] private summary

Agent 当时理解:
- [U1 <- R1] private process

Agent 计划:
- [P1 <- R1] private plan

执行轨迹:
- [E1 <- P1 | completed] private execution

为什么做:
- private why

做了什么:
- private change

技术备注:
- /Users/example/private.js

结果:
- private result

### 2026-07-18 — Team record

记录 ID: bt-20260718-team
来源可信度: confirmed
来源覆盖: current-turn
关联任务: codex-thread/team
依据: /Users/example/team.txt
场景: feature
可见范围: team
结果状态: 待观察
后续回看: 2026-08-18

沟通原文:
- [Q1 | user | codex-thread/team/item/1 | verbatim]
  > TEAM EXACT WORDS

需求总结:
- [R1 <- Q1] team summary

Agent 当时理解:
- [U1 <- R1] team process

Agent 计划:
- [P1 <- R1] team plan

执行轨迹:
- [E1 <- P1 | completed] team execution at /Users/example/project

为什么做:
- team why

做了什么:
- team change

技术备注:
- /Users/example/team.js

结果:
- pending

### 2026-07-19 — Public record

记录 ID: bt-20260719-public
来源可信度: confirmed
来源覆盖: current-turn
关联任务: codex-thread/public
依据: /Users/example/public.txt
场景: analytics-data
可见范围: public
结果状态: 有效
后续回看: 无

沟通原文:
- [Q1 | user | codex-thread/public/item/1 | verbatim]
  > PUBLIC RAW WORDS

需求总结:
- [R1 <- Q1] public summary

Agent 当时理解:
- [U1 <- R1] public process

Agent 计划:
- [P1 <- R1] public plan

执行轨迹:
- [E1 <- P1 | completed] public execution

人的假设:
- [H1] public hypothesis

为什么做:
- public why

做了什么:
- public change

数据变化:
- [D1 | 日期=2026-07-19 | 指标=users | 值=1000 | 来源=analytics] public data

结果判断:
- [O1 | supported | 日期=2026-07-19] public judgment

决策原则:
- [dp-public-proof | 产品] public principle

技术备注:
- /Users/example/public.js

结果:
- public result
`;
    await writeFile(join(target, "docs/buildtrace/BUILDTRACE.md"), source);

    const publicResult = spawnSync(process.execPath, [cli, "publish", "--profile", "public", "--target", target, "--output", publicOutput], { encoding: "utf8" });
    assert.equal(publicResult.status, 0, publicResult.stderr);
    const publicSource = await readFile(join(publicOutput, "BUILDTRACE.md"), "utf8");
    assert.match(publicSource, /Public record/);
    assert.match(publicSource, /public hypothesis/);
    assert.doesNotMatch(publicSource, /Private only|Team record|PRIVATE EXACT|TEAM EXACT|PUBLIC RAW WORDS/);
    assert.doesNotMatch(publicSource, /Agent 当时理解|Agent 计划|执行轨迹|技术备注|项目入口|\/Users\//);
    assert.equal(JSON.parse(await readFile(join(publicOutput, "PUBLISH-MANIFEST.json"), "utf8")).publishedRecordCount, 1);

    const teamResult = spawnSync(process.execPath, [cli, "publish", "--profile", "team", "--target", target, "--output", teamOutput], { encoding: "utf8" });
    assert.equal(teamResult.status, 0, teamResult.stderr);
    const teamSource = await readFile(join(teamOutput, "BUILDTRACE.md"), "utf8");
    assert.match(teamSource, /Team record|Public record/);
    assert.match(teamSource, /TEAM EXACT WORDS/);
    assert.doesNotMatch(teamSource, /Private only|PRIVATE EXACT WORDS|\/Users\//);
  } finally {
    await rm(target, { recursive: true, force: true });
    await rm(publicOutput, { recursive: true, force: true });
    await rm(teamOutput, { recursive: true, force: true });
  }
});

test("playbook merges stable principle IDs across projects and reports wording conflicts", async () => {
  const projectA = await mkdtemp(join(tmpdir(), "buildtrace-playbook-a-"));
  const projectB = await mkdtemp(join(tmpdir(), "buildtrace-playbook-b-"));
  try {
    for (const [target, project, text] of [[projectA, "Project A", "Keep human judgment."], [projectB, "Project B", "Keep the human decision visible."]]) {
      await mkdir(join(target, "docs/buildtrace"), { recursive: true });
      await writeFile(join(target, "docs/buildtrace/BUILDTRACE.md"), `# ${project}\n\n## 项目记录\n\n### 2026-07-19 — Decision\n\n记录 ID: bt-20260719-decision\n依据: notes\n场景: decision\n可见范围: private\n结果状态: 不确定\n后续回看: 无\n\n决策原则:\n- [dp-human-first | 产品] ${text}\n`);
    }
    const result = spawnSync(process.execPath, [cli, "playbook", "--target", projectA, "--target", projectB, "--format", "json"], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const playbook = JSON.parse(result.stdout);
    assert.equal(playbook.projectCount, 2);
    assert.equal(playbook.conflictCount, 1);
    assert.equal(playbook.principles[0].id, "dp-human-first");
    assert.equal(playbook.principles[0].evidence.length, 2);
  } finally {
    await rm(projectA, { recursive: true, force: true });
    await rm(projectB, { recursive: true, force: true });
  }
});

test("serve exposes the Viewer and Markdown source", async (context) => {
  const child = spawn(process.execPath, [cli, "serve", "--port", "0"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  context.after(() => child.kill("SIGTERM"));

  const output = await waitForOutput(child, /http:\/\/localhost:(\d+)/);
  const port = Number(output.match(/http:\/\/localhost:(\d+)/)[1]);

  const page = await fetch(`http://127.0.0.1:${port}/`);
  const sourceResponse = await fetch(`http://127.0.0.1:${port}/docs/buildtrace/BUILDTRACE.md`);
  const privateResponse = await fetch(`http://127.0.0.1:${port}/package.json`);

  assert.equal(page.status, 200);
  assert.match(await page.text(), /Project Memory/);
  assert.equal(sourceResponse.status, 200);
  assert.match(await sourceResponse.text(), /项目初心/);
  assert.equal(privateResponse.status, 403);
});

function waitForOutput(child, pattern) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for server output: ${output}`)), 5000);

    child.stdout.on("data", (chunk) => {
      output += chunk;
      if (pattern.test(output)) {
        clearTimeout(timeout);
        resolve(output);
      }
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.once("exit", (code) => {
      if (!pattern.test(output)) {
        clearTimeout(timeout);
        reject(new Error(`Server exited with ${code}: ${output}`));
      }
    });
  });
}
