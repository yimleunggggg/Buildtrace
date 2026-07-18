import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../bin/buildtrace.mjs", import.meta.url));

test("doctor validates the repository", () => {
  const result = spawnSync(process.execPath, [cli, "doctor"], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /BuildTrace doctor passed/);
  assert.match(result.stdout, /3 project records/);
});

test("init creates the portable package without overwriting existing files", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-init-"));
  try {
    const existingPath = join(target, "docs/buildtrace/BUILDTRACE.md");
    await mkdir(join(target, "docs/buildtrace"), { recursive: true });
    await writeFile(existingPath, "# Existing source\n");
    await writeFile(join(target, "AGENTS.md"), "# Existing agent rules\n");

    const result = spawnSync(process.execPath, [cli, "init", "--target", target], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(await readFile(existingPath, "utf8"), "# Existing source\n");
    assert.match(await readFile(join(target, "docs/buildtrace/viewer/index.html"), "utf8"), /BuildTrace/);
    assert.match(await readFile(join(target, "bin/buildtrace.mjs"), "utf8"), /async function serve/);
    assert.equal(await readFile(join(target, "AGENTS.md"), "utf8"), "# Existing agent rules\n");
    assert.match(await readFile(join(target, "AGENTS.md.buildtrace"), "utf8"), /only project-memory source/);
    assert.match(result.stdout, /kept/);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("initialized CLI works inside a CommonJS project", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-commonjs-"));
  try {
    await writeFile(join(target, "package.json"), '{"type":"commonjs"}\n');
    const initResult = spawnSync(process.execPath, [cli, "init", "--target", target], { encoding: "utf8" });
    assert.equal(initResult.status, 0, initResult.stderr);

    const installedCli = join(target, "bin/buildtrace.mjs");
    assert.match(await readFile(join(target, "AGENTS.md"), "utf8"), /only project-memory source/);
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
    const initResult = spawnSync(process.execPath, [cli, "init", "--target", target], { encoding: "utf8" });
    assert.equal(initResult.status, 0, initResult.stderr);
    const sourcePath = join(target, "docs/buildtrace/BUILDTRACE.md");
    const source = await readFile(sourcePath, "utf8");
    await writeFile(sourcePath, source.replace("依据: BuildTrace init", "依据:"));

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

test("init creates an immediately readable project source", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-template-"));
  try {
    const result = spawnSync(process.execPath, [cli, "init", "--target", target], { encoding: "utf8" });
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
