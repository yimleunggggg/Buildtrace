import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { lstat, mkdir, mkdtemp, readFile, readlink, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../bin/buildtrace.mjs", import.meta.url));
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

async function startViewerServer() {
  const child = spawn(process.execPath, [cli, "serve", "--port", "0"], {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const output = await waitForOutput(child, /BuildTrace Viewer: (http:\/\/localhost:\d+)/);
  const url = output.match(/BuildTrace Viewer: (http:\/\/localhost:\d+)/)[1];
  return { child, url };
}

test("overview reads only selected projects and starts usable live viewers", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-overview-"));
  const initResult = spawnSync(process.execPath, [cli, "init", "--target", target, "--codex-home", join(target, "fake-home")], {encoding:"utf8"});
  assert.equal(initResult.status, 0, initResult.stderr);
  const child = spawn(process.execPath, [cli, "overview", "--target", target, "--port", "0"], {stdio:["ignore","pipe","pipe"]});
  try {
    const output = await waitForOutput(child, /BuildTrace Overview: (http:\/\/localhost:\d+)/);
    const url = output.match(/BuildTrace Overview: (http:\/\/localhost:\d+)/)[1];
    const response = await fetch(`${url}/projects.json`);
    const rows = await response.json();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].count, 1);
    assert.equal((await fetch(rows[0].url)).status, 200);
    assert.equal((await fetch(`${url}/.git/config`)).status, 404);
    await writeFile(join(target,"docs/buildtrace/BUILDTRACE.md"), "# Updated title\n");
    const updated = await (await fetch(`${url}/projects.json`)).json();
    assert.equal(updated[0].title, "Updated title");
    assert.equal(updated[0].count, 0);
  } finally {
    child.kill("SIGTERM");
    await new Promise((done) => child.once("exit", done));
    await rm(target, {recursive:true,force:true});
  }
});

test("overview opens old archives with shared assets, keeps missing candidates visible and performs no initialization",async()=>{
  const target=await mkdtemp(join(tmpdir(),"buildtrace-old-overview-"));
  await mkdir(join(target,"docs/buildtrace"),{recursive:true});
  const archive="# Old project\n## 2026-07-08 MVP\n- Actual old note\n";
  await writeFile(join(target,"docs/buildtrace/BUILDTRACE.md"),archive);
  const missing=join(target,"unstarted");await mkdir(missing);
  const child=spawn(process.execPath,[cli,"overview","--target",target,"--target",missing,"--port","0"],{stdio:["ignore","pipe","pipe"]});
  try{
    const output=await waitForOutput(child,/BuildTrace Overview: (http:\/\/localhost:\d+)/);
    const url=output.match(/BuildTrace Overview: (http:\/\/localhost:\d+)/)[1];
    const rows=await(await fetch(url+"/projects.json")).json();
    assert.equal(rows[0].count,1);assert.equal(rows[1].count,null);assert.equal(rows[1].url,"");
    const view=await fetch(rows[0].url);assert.equal(view.status,200);
    const module=await fetch(new URL("reading-model.mjs",view.url));assert.equal(module.status,200);
    const saved=await fetch(new URL("/docs/buildtrace/BUILDTRACE.md",view.url));assert.equal(await saved.text(),archive);
    await assert.rejects(lstat(join(target,".buildtrace")),/ENOENT/);
    assert.equal(await readFile(join(target,"docs/buildtrace/BUILDTRACE.md"),"utf8"),archive);
    assert.equal((await fetch(url+"/open?id=999")).status,404);
  }finally{child.kill("SIGTERM");await new Promise(done=>child.once("exit",done));await rm(target,{recursive:true,force:true});}
});

test("doctor validates the repository", () => {
  const result = spawnSync(process.execPath, [cli, "doctor"], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /BuildTrace doctor passed/);
  assert.match(result.stdout, /\d+ project records/);
});

test("local viewer opens project resources without exposing private working files", async () => {
  const { child, url } = await startViewerServer();
  try {
    const readme = await fetch(`${url}/README.md`);
    const productBrief = await fetch(`${url}/docs/PRODUCT-AND-IMPLEMENTATION.zh-CN.md`);
    const privateGit = await fetch(`${url}/.git/config`);
    const privateEnv = await fetch(`${url}/.env`);

    assert.equal(readme.status, 200);
    assert.match(await readme.text(), /BuildTrace/);
    assert.equal(productBrief.status, 200);
    assert.match(await productBrief.text(), /Claude 读完后应该怎样理解自己的角色/);
    assert.equal(privateGit.status, 403);
    assert.equal(privateEnv.status, 403);
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolveExit) => child.once("exit", resolveExit));
  }
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
    assert.match(await readFile(join(target, "CLAUDE.md"), "utf8"), /Claude's contemporaneous understanding/);
    assert.match(await readFile(join(target, ".github/copilot-instructions.md"), "utf8"), /BuildTrace project memory/);
    assert.match(await readFile(join(target, "GEMINI.md"), "utf8"), /BuildTrace project memory/);
    assert.match(await readFile(join(target, ".windsurf/rules/buildtrace.md"), "utf8"), /BuildTrace project memory/);
    const buildtraceAgentRules = await readFile(join(target, "AGENTS.md"), "utf8");
    assert.ok(buildtraceAgentRules.startsWith("# Existing agent rules\n"));
    assert.match(buildtraceAgentRules, /buildtrace:project-adapter:start/);
    assert.match(buildtraceAgentRules, /default project-memory source/);
    assert.match(buildtraceAgentRules, /Do not wait for fixed commands/);
    const { readdir } = await import("node:fs/promises");
    const [backupName] = await readdir(join(target, ".buildtrace/backups"));
    assert.equal(await readFile(join(target, ".buildtrace/backups", backupName, "AGENTS.md"), "utf8"), "# Existing agent rules\n");
    const repeated = spawnSync(process.execPath, [cli, "init", "--target", target, "--codex-home", join(target, "fake-codex-home")], { encoding: "utf8" });
    assert.equal(repeated.status, 0, repeated.stderr);
    assert.equal(await readFile(join(target, "AGENTS.md"), "utf8"), buildtraceAgentRules);
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
    const cursorRulePath = join(target, ".cursor/rules/buildtrace.mdc");
    const projectSource = await readFile(sourcePath, "utf8");
    await writeFile(viewerPath, "// old viewer\n");
    await writeFile(cursorRulePath, "# old BuildTrace rule\n");
    await rm(join(target, "CLAUDE.md"));
    await writeFile(join(target, ".buildtrace/.gitignore"), "custom-private/\n");

    const result = spawnSync(process.execPath, [cli, "sync", "--target", target], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /\d+ updated/);
    assert.match(result.stdout, /Project facts were not touched/);
    assert.equal(await readFile(sourcePath, "utf8"), projectSource);
    assert.match(await readFile(viewerPath, "utf8"), /resourceVault/);
    assert.match(await readFile(cursorRulePath, "utf8"), /buildtrace:managed-adapter/);
    assert.match(await readFile(join(target, "CLAUDE.md"), "utf8"), /Claude's contemporaneous understanding/);

    const backupRoot = join(target, ".buildtrace", "backups");
    const { readdir } = await import("node:fs/promises");
    const [backupName] = await readdir(backupRoot);
    assert.equal(await readFile(join(backupRoot, backupName, "docs/buildtrace/viewer/app.js"), "utf8"), "// old viewer\n");
    const privateIgnore = await readFile(join(target, ".buildtrace/.gitignore"), "utf8");
    assert.match(privateIgnore, /^custom-private\/$/m);
    assert.match(privateIgnore, /^backups\/$/m);
    assert.match(privateIgnore, /^recovery\/$/m);
    assert.match(privateIgnore, /^history\/$/m);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("history snapshots detect rewritten evidence and restore without losing the replaced version", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-history-"));
  try {
    const initResult = spawnSync(process.execPath, [cli, "init", "--target", target, "--codex-home", join(target, "fake-codex-home")], { encoding: "utf8" });
    assert.equal(initResult.status, 0, initResult.stderr);
    const sourcePath = join(target, "docs/buildtrace/BUILDTRACE.md");
    const original = `# History fixture\n\n## 项目记录\n\n### 2026-10-13 — Preserve evidence\n\n记录 ID: bt-20261013-preserve-evidence\n来源可信度: confirmed\n来源覆盖: current-turn\n关联任务: current-turn\n依据: current-turn\n场景: decision\n关键节点: 否\n可见范围: private\n结果状态: 不确定\n后续回看: 无\n\n沟通原文:\n- [Q1 | user | current-turn/message-1 | verbatim]\n  > 用户完整原话。\n\n需求总结:\n- [R1 <- Q1] 保留原话。\n\nAgent 当时理解:\n- [U1 <- R1] 不重写。\n\nAgent 计划:\n- [P1 <- R1] 先留快照。\n\n执行轨迹:\n- [E1 <- P1 | completed] 已留快照。\n\n为什么做:\n- 防止误改。\n\n做了什么:\n- 增加历史。\n\n结果:\n- 待回看。\n`;
    await writeFile(sourcePath, original);

    const snapshot = spawnSync(process.execPath, [cli, "snapshot", "--target", target, "--reason", "test-baseline"], { encoding: "utf8" });
    assert.equal(snapshot.status, 0, snapshot.stderr);
    const hash = snapshot.stdout.match(/[a-f0-9]{12}/)?.[0];
    assert.ok(hash);

    const appended = original.replace("结果:\n- 待回看。", "结果:\n- 待回看。\n- 追加结果不会删除旧证据。\n");
    await writeFile(sourcePath, appended);
    const appendVerification = spawnSync(process.execPath, [cli, "verify-history", "--target", target], { encoding: "utf8" });
    assert.equal(appendVerification.status, 0, appendVerification.stderr);

    const rewritten = appended.replace("用户完整原话", "被 Agent 改写的原话");
    await writeFile(sourcePath, rewritten);
    const rewriteVerification = spawnSync(process.execPath, [cli, "verify-history", "--target", target], { encoding: "utf8" });
    assert.notEqual(rewriteVerification.status, 0);
    assert.match(rewriteVerification.stdout, /existing quote text was removed or rewritten/);

    const restore = spawnSync(process.execPath, [cli, "restore", "--target", target, "--snapshot", hash, "--confirm"], { encoding: "utf8" });
    assert.equal(restore.status, 0, restore.stderr);
    assert.equal(await readFile(sourcePath, "utf8"), original);
    assert.match(await readFile(join(target, ".buildtrace/history/index.jsonl"), "utf8"), /before-restore/);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("quote audit distinguishes verbatim evidence from missing provenance", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-quotes-"));
  try {
    const initResult = spawnSync(process.execPath, [cli, "init", "--target", target, "--codex-home", join(target, "fake-codex-home")], { encoding: "utf8" });
    assert.equal(initResult.status, 0, initResult.stderr);
    const sourcePath = join(target, "docs/buildtrace/BUILDTRACE.md");
    const source = await readFile(sourcePath, "utf8");
    await writeFile(sourcePath, source.replace("[Q1 | system | buildtrace-init | artifact-evidence]", "[Q1 | user | current-turn/message-1 | verbatim]"));
    const valid = spawnSync(process.execPath, [cli, "audit-quotes", "--target", target], { encoding: "utf8" });
    assert.equal(valid.status, 0, valid.stderr);
    assert.match(valid.stdout, /1\/1 records/);

    const validSource = await readFile(sourcePath, "utf8");
    await writeFile(sourcePath, validSource.replace("| verbatim]", "| unknown]"));
    const invalid = spawnSync(process.execPath, [cli, "audit-quotes", "--target", target], { encoding: "utf8" });
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stdout, /fidelity must be/);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("history verification keeps multiple BuildTrace sources in one project isolated", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-history-sources-"));
  try {
    await mkdir(join(target, "docs/buildtrace"), { recursive: true });
    await mkdir(join(target, ".buildtrace/private-self"), { recursive: true });
    const publicSource = join(target, "docs/buildtrace/BUILDTRACE.md");
    const privateSource = join(target, ".buildtrace/private-self/BUILDTRACE.md");
    await writeFile(publicSource, "# Public\n\n## 项目记录\n\n### 2026-10-13 — Public\n\n记录 ID: bt-public\n");
    await writeFile(privateSource, "# Private\n\n## 项目记录\n\n### 2026-10-13 — Private\n\n记录 ID: bt-private\n");
    assert.equal(spawnSync(process.execPath, [cli, "snapshot", "--target", target, "--source", publicSource], { encoding: "utf8" }).status, 0);
    assert.equal(spawnSync(process.execPath, [cli, "snapshot", "--target", target, "--source", privateSource], { encoding: "utf8" }).status, 0);
    const verification = spawnSync(process.execPath, [cli, "verify-history", "--target", target, "--source", privateSource], { encoding: "utf8" });
    assert.equal(verification.status, 0, verification.stderr);
    assert.doesNotMatch(verification.stdout, /bt-public/);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("sync keeps custom root Agent instructions and refreshes only the managed BuildTrace block", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-sync-adapter-"));
  try {
    await writeFile(join(target, "CLAUDE.md"), "# Existing project instructions\n");
    await writeFile(join(target, "AGENTS.md"), "# Existing cross-tool instructions\n");
    const result = spawnSync(process.execPath, [cli, "sync", "--target", target], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const first = await readFile(join(target, "CLAUDE.md"), "utf8");
    assert.match(first, /^# Existing project instructions$/m);
    assert.match(first, /buildtrace:project-adapter:start/);
    await writeFile(join(target, "CLAUDE.md"), `${first}\nKEEP-ME\n`);
    const second = spawnSync(process.execPath, [cli, "sync", "--target", target], { encoding: "utf8" });
    assert.equal(second.status, 0, second.stderr);
    const updated = await readFile(join(target, "CLAUDE.md"), "utf8");
    assert.match(updated, /^# Existing project instructions$/m);
    assert.match(updated, /^KEEP-ME$/m);
    assert.equal(updated.match(/buildtrace:project-adapter:start/g)?.length, 1);
    const agents = await readFile(join(target, "AGENTS.md"), "utf8");
    assert.ok(agents.startsWith("# Existing cross-tool instructions\n"));
    assert.equal(agents.match(/buildtrace:project-adapter:start/g)?.length, 1);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("snapshot refuses a history index symlink without changing its destination", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-history-index-"));
  try {
    await mkdir(join(target, "docs/buildtrace"), { recursive: true });
    await writeFile(join(target, "docs/buildtrace/BUILDTRACE.md"), "# Test archive\n");
    await mkdir(join(target, ".buildtrace/history"), { recursive: true });
    const unrelated = join(target, "unrelated.txt");
    await writeFile(unrelated, "Keep this unchanged\n");
    await symlink(unrelated, join(target, ".buildtrace/history/index.jsonl"));
    const result = spawnSync(process.execPath, [cli, "snapshot", "--target", target], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /symlink/);
    assert.equal(await readFile(unrelated, "utf8"), "Keep this unchanged\n");
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("status reports the target archive without claiming live capture or changing it", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-status-"));
  try {
    const missing = spawnSync(process.execPath, [cli, "status", "--json"], { cwd: target, encoding: "utf8" });
    assert.equal(missing.status, 0, missing.stderr);
    assert.equal(JSON.parse(missing.stdout).initialized, false);
    const initResult = spawnSync(process.execPath, [cli, "init", "--target", target, "--codex-home", join(target, "fake-codex-home")], { encoding: "utf8" });
    assert.equal(initResult.status, 0, initResult.stderr);
    const sourcePath = join(target, "docs/buildtrace/BUILDTRACE.md");
    const original = await readFile(sourcePath, "utf8");
    const status = spawnSync(process.execPath, [cli, "status", "--json"], { cwd: target, encoding: "utf8" });
    assert.equal(status.status, 0, status.stderr);
    const report = JSON.parse(status.stdout);
    assert.equal(report.target, await realpath(target));
    assert.equal(report.records, 1);
    assert.equal(report.capture, "agent-written");
    assert.equal(report.latest.title, "BuildTrace 初始化");
    assert.match(report.sha256, /^[a-f0-9]{64}$/);
    assert.equal(report.adapters.find((item) => item.path === "AGENTS.md").configured, true);
    assert.equal(await readFile(sourcePath, "utf8"), original);
    const customSource = join(target, "private-history.md");
    await writeFile(customSource, original.replace("# buildtrace-status-", "# Private project "));
    const customStatus = spawnSync(process.execPath, [cli, "status", "--target", target, "--source", customSource, "--json"], { encoding: "utf8" });
    assert.equal(customStatus.status, 0, customStatus.stderr);
    assert.equal(JSON.parse(customStatus.stdout).source, customSource);
    const help = spawnSync(process.execPath, [cli, "--help"], { encoding: "utf8" });
    assert.match(help.stdout, /buildtrace status/);
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
    assert.match(result.stderr, /refusing to .*symlink/);
    assert.equal(await readFile(external, "utf8"), "// outside target\n");
  } finally {
    await rm(target, { recursive: true, force: true });
    await rm(external, { force: true });
  }
});

test("init refuses broken leaf and ancestor symlinks that escape the project", async () => {
  for (const kind of ["leaf", "ancestor"]) {
    const target = await mkdtemp(join(tmpdir(), `buildtrace-init-${kind}-link-`));
    const outside = join(tmpdir(), `buildtrace-init-${kind}-outside-${Date.now()}`);
    try {
      if (kind === "leaf") {
        await symlink(join(outside, "CLAUDE.md"), join(target, "CLAUDE.md"));
      } else {
        await mkdir(outside, { recursive: true });
        await symlink(outside, join(target, ".github"), "dir");
      }
      const result = spawnSync(process.execPath, [cli, "init", "--target", target, "--codex-home", join(target, "fake-codex-home")], { encoding: "utf8" });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /symlink/);
      await assert.rejects(lstat(join(outside, kind === "leaf" ? "CLAUDE.md" : "copilot-instructions.md")), { code: "ENOENT" });
    } finally {
      await rm(target, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }
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
      resolve(repoRoot, "skill/buildtrace"),
    );
    assert.match(await readFile(join(destination, "SKILL.md"), "utf8"), /name: buildtrace/);
    assert.match(await readFile(join(destination, "agents/openai.yaml"), "utf8"), /BuildTrace/);

    const second = spawnSync(
      process.execPath,
      [cli, "install-codex-skill", "--dest", destination],
      { encoding: "utf8" },
    );
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /current/);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("setup installs clean skills and idempotent global auto-activation rules", async () => {
  const userHome = await mkdtemp(join(tmpdir(), "buildtrace-setup-home-"));
  try {
    const first = spawnSync(process.execPath, [cli, "setup", "--home", userHome], { encoding: "utf8" });
    assert.equal(first.status, 0, first.stderr);
    for (const destination of [
      ".agents/skills/buildtrace",
      ".claude/skills/buildtrace",
      ".cursor/skills/buildtrace",
      ".copilot/skills/buildtrace",
    ]) {
      const pathname = join(userHome, destination);
      assert.equal((await lstat(pathname)).isSymbolicLink(), true);
      assert.equal(resolve(dirname(pathname), await readlink(pathname)), resolve(repoRoot, "skill/buildtrace"));
      assert.match(await readFile(join(pathname, "SKILL.md"), "utf8"), /rules only/);
      await assert.rejects(readFile(join(pathname, "BUILDTRACE.md")), { code: "ENOENT" });
    }
    const claudeInstructions = join(userHome, ".claude/CLAUDE.md");
    assert.match(await readFile(claudeInstructions, "utf8"), /buildtrace init/);

    const second = spawnSync(process.execPath, [cli, "setup", "--home", userHome], { encoding: "utf8" });
    assert.equal(second.status, 0, second.stderr);
    const content = await readFile(claudeInstructions, "utf8");
    assert.equal(content.match(/buildtrace:auto:start/g)?.length, 1);
  } finally {
    await rm(userHome, { recursive: true, force: true });
  }
});

test("setup migrates a BuildTrace Skill symlink from an older checkout", async () => {
  const userHome = await mkdtemp(join(tmpdir(), "buildtrace-setup-legacy-home-"));
  const legacyCheckout = await mkdtemp(join(tmpdir(), "buildtrace-legacy-checkout-"));
  try {
    await mkdir(join(legacyCheckout, "docs/buildtrace"), { recursive: true });
    await writeFile(join(legacyCheckout, "docs/buildtrace/SKILL.md"), "---\nname: buildtrace\n---\n# Legacy BuildTrace\n");
    await writeFile(join(legacyCheckout, "docs/buildtrace/BUILDTRACE.md"), "# Legacy project archive\n");
    const destination = join(userHome, ".agents/skills/buildtrace");
    await mkdir(dirname(destination), { recursive: true });
    await symlink(join(legacyCheckout, "docs/buildtrace"), destination, "dir");

    const result = spawnSync(process.execPath, [cli, "setup", "--home", userHome], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(resolve(dirname(destination), await readlink(destination)), resolve(repoRoot, "skill/buildtrace"));
    await assert.rejects(readFile(join(destination, "BUILDTRACE.md")), { code: "ENOENT" });
    assert.match(result.stdout, /removed legacy project-archive Skill link/);
  } finally {
    await rm(userHome, { recursive: true, force: true });
    await rm(legacyCheckout, { recursive: true, force: true });
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
    assert.match(agentRules, /default project-memory source/);
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

test("recovery discovers sibling worktrees, historical aliases and transitive native lineage", async () => {
  const fixture = await mkdtemp(join(tmpdir(), "buildtrace-worktree-audit-"));
  try {
    const target = join(fixture, "main");
    const linked = join(fixture, "linked");
    const codexHome = join(fixture, "codex");
    const alias = join(fixture, "old-location");
    await mkdir(target);
    await mkdir(alias);
    for (const args of [["init", target], ["-C", target, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "--allow-empty", "-m", "fixture"], ["-C", target, "worktree", "add", "--detach", linked]]) {
      const git = spawnSync("git", args, { encoding: "utf8" });
      assert.equal(git.status, 0, git.stderr);
    }
    await mkdir(join(codexHome, "sessions"), { recursive: true });
    const sessions = [
      { id: "parent", cwd: linked },
      { id: "child", cwd: "/not-the-project", source: { subagent: { thread_spawn: { parent_thread_id: "parent" } } } },
      { id: "grandchild", cwd: "/another-location", source: { subagent: { thread_spawn: { parent_thread_id: "child" } } } },
      { id: "old", cwd: alias },
      { id: "unrelated", cwd: "/unrelated" },
    ];
    for (const payload of sessions) await writeFile(join(codexHome, "sessions", `${payload.id}.jsonl`), JSON.stringify({ type: "session_meta", payload }) + "\n");
    const result = spawnSync(process.execPath, [cli, "recover", "--target", target, "--codex-home", codexHome, "--claude-home", join(fixture, "claude"), "--project-alias", alias], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(await readFile(join(target, ".buildtrace/recovery/latest.json"), "utf8"));
    assert.equal(report.coverage.git.worktrees.length, 2);
    assert.equal(report.coverage.git.commonDirectory, await realpath(join(target, ".git")));
    assert.deepEqual(report.threads.map((thread) => thread.threadId).sort(), ["child", "grandchild", "old", "parent"]);
    assert.equal(report.threads.find((thread) => thread.threadId === "grandchild").matchedBy, "native-lineage");
    assert.equal(report.project.historicalAliases.length, 1);
  } finally {
    await rm(fixture, { recursive: true, force: true });
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

test("recover inventories matching Claude Code sessions without copying transcript text", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-claude-project-"));
  const claudeHome = await mkdtemp(join(tmpdir(), "buildtrace-claude-home-"));
  const codexHome = await mkdtemp(join(tmpdir(), "buildtrace-empty-codex-"));
  try {
    const sessionDirectory = join(claudeHome, "projects", target.replaceAll("/", "-"));
    await mkdir(sessionDirectory, { recursive: true });
    const session = [
      { type: "user", sessionId: "claude-session", uuid: "claude-user-1", cwd: target, timestamp: "2026-07-19T00:00:00Z", message: { role: "user", content: "claude private exact words" } },
      { type: "assistant", sessionId: "claude-session", uuid: "claude-agent-1", parentUuid: "claude-user-1", cwd: target, timestamp: "2026-07-19T00:00:01Z", message: { role: "assistant", content: [] } },
      { type: "summary", sessionId: "claude-session", cwd: target, timestamp: "2026-07-19T00:00:02Z", summary: "private compact" },
    ].map((row) => JSON.stringify(row)).join("\n");
    await writeFile(join(sessionDirectory, "session.jsonl"), `${session}\n`);

    const result = spawnSync(process.execPath, [cli, "recover", "--target", target, "--codex-home", codexHome, "--claude-home", claudeHome], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Claude Code: 1 matching local session/);
    const manifestText = await readFile(join(target, ".buildtrace/recovery/latest.json"), "utf8");
    const manifest = JSON.parse(manifestText);
    assert.equal(manifest.coverage.claudeLocalSessions.matchedSessionCount, 1);
    assert.equal(manifest.claudeSessions[0].sessionId, "claude-session");
    assert.equal(manifest.totals.exactUserMessages, 1);
    assert.equal(manifest.totals.compactedWindows, 1);
    assert.equal(manifest.coverage.multiAgent.status, "not-found");
    assert.equal(manifest.coverage.multiAgent.claudeParentMessageRefs, 1);
    assert.doesNotMatch(manifestText, /claude private exact words|private compact/);
  } finally {
    await rm(target, { recursive: true, force: true });
    await rm(claudeHome, { recursive: true, force: true });
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
      await writeFile(join(target, "docs/buildtrace/BUILDTRACE.md"), `# ${project}\n\n## 项目记录\n\n### 2026-07-19 — Decision\n\n记录 ID: bt-20260719-decision\n来源可信度: confirmed\n依据: notes\n场景: decision\n可见范围: private\n结果状态: 不确定\n后续回看: 无\n\n决策原则:\n- [dp-human-first | 分类=产品 | 确认=user-confirmed] ${text}\n`);
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
  const downloadResponse = await fetch(`http://127.0.0.1:${port}/docs/buildtrace/BUILDTRACE.md?download=1`);
  const privateResponse = await fetch(`http://127.0.0.1:${port}/package.json`);

  assert.equal(page.status, 200);
  assert.match(await page.text(), /Project Memory/);
  assert.equal(sourceResponse.status, 200);
  assert.match(await sourceResponse.text(), /项目初心/);
  assert.match(downloadResponse.headers.get("content-disposition"), /attachment/);
  assert.equal(privateResponse.status, 403);
});

test("serve refuses docs symlinks that resolve outside the target", async (context) => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-serve-symlink-"));
  const outside = join(tmpdir(), `buildtrace-serve-secret-${Date.now()}.txt`);
  await mkdir(join(target, "docs/buildtrace/viewer"), { recursive: true });
  await writeFile(join(target, "docs/buildtrace/BUILDTRACE.md"), "# Project\n");
  await writeFile(join(target, "docs/buildtrace/viewer/index.html"), "<title>Viewer</title>\n");
  await writeFile(outside, "outside secret\n");
  await symlink(outside, join(target, "docs/leak.txt"));

  const child = spawn(process.execPath, [cli, "serve", "--target", target, "--port", "0"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  context.after(async () => {
    child.kill("SIGTERM");
    await rm(target, { recursive: true, force: true });
    await rm(outside, { force: true });
  });
  const output = await waitForOutput(child, /http:\/\/localhost:(\d+)/);
  const port = Number(output.match(/http:\/\/localhost:(\d+)/)[1]);
  const response = await fetch(`http://127.0.0.1:${port}/docs/leak.txt`);
  assert.equal(response.status, 403);
  assert.doesNotMatch(await response.text(), /outside secret/);
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
