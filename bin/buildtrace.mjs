#!/usr/bin/env node

import { createReadStream, existsSync } from "node:fs";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseBuildtrace } from "../docs/buildtrace/viewer/parser.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultPort = 4173;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

const requiredFiles = [
  "docs/buildtrace/BUILDTRACE.md",
  "docs/buildtrace/SKILL.md",
  "docs/buildtrace/viewer/index.html",
  "docs/buildtrace/viewer/styles.css",
  "docs/buildtrace/viewer/app.js",
  "docs/buildtrace/viewer/parser.js",
  "docs/buildtrace/viewer/parser.mjs",
  "docs/buildtrace/viewer/serve.mjs",
];

const publicRoot = join(root, "docs/buildtrace");

function getOption(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

async function doctor(base = root) {
  const missing = requiredFiles.filter((file) => !existsSync(join(base, file)));
  if (missing.length) {
    for (const file of missing) log(`✗ missing ${file}`);
    throw new Error(`${missing.length} required BuildTrace file(s) are missing`);
  }

  const markdown = await readFile(join(base, "docs/buildtrace/BUILDTRACE.md"), "utf8");
  const trace = parseBuildtrace(markdown);
  if (!trace.principles.length) throw new Error("项目初心 / project intent is missing");
  if (!trace.entries.length) throw new Error("项目记录 / project records are missing");
  const recordErrors = validateRecords(trace.entries);
  if (recordErrors.length) {
    for (const error of recordErrors) log(`✗ ${error}`);
    throw new Error(`${recordErrors.length} invalid project record field(s)`);
  }

  log(`✓ Node ${process.versions.node}`);
  log(`✓ ${requiredFiles.length} required files`);
  log(`✓ ${trace.principles.length} project principles`);
  log(`✓ ${trace.entries.length} project records`);
  log("BuildTrace doctor passed.");
}

function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function validateRecords(entries) {
  const sourceTrustValues = new Set(["confirmed", "inferred", "unknown"]);
  const statusValues = new Set(["待观察", "有效", "无效", "不确定"]);
  const errors = [];

  for (const entry of entries) {
    const name = `${entry.date} — ${entry.title}`;
    if (!isValidISODate(entry.date)) errors.push(`${name}: invalid record date`);
    if (!sourceTrustValues.has(entry.sourceTrust)) errors.push(`${name}: invalid 来源可信度`);
    if (!entry.evidence.trim()) errors.push(`${name}: 依据 is required`);
    if (!entry.scene.trim()) errors.push(`${name}: 场景 is required`);
    if (!statusValues.has(entry.status)) errors.push(`${name}: invalid 结果状态`);
    if (entry.reviewDate !== "无" && !isValidISODate(entry.reviewDate)) errors.push(`${name}: invalid 后续回看`);
    if (entry.status === "待观察" && !isValidISODate(entry.reviewDate)) errors.push(`${name}: 待观察 requires a review date`);
    for (const [section, value] of Object.entries(entry.sections)) {
      if (!value.trim()) errors.push(`${name}: ${section} section is required`);
    }
  }

  return errors;
}

function safeLocalPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const requested = resolve(root, `.${decoded}`);
  if (requested !== publicRoot && !requested.startsWith(`${publicRoot}${sep}`)) return null;
  return requested;
}

async function serve() {
  const parsedPort = Number(getOption("--port", process.env.PORT || defaultPort));
  if (!Number.isInteger(parsedPort) || parsedPort < 0 || parsedPort > 65535) {
    throw new Error("--port must be an integer between 0 and 65535");
  }

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://localhost");
      if (url.pathname === "/") {
        response.writeHead(302, { Location: "/docs/buildtrace/viewer/" });
        response.end();
        return;
      }

      let filePath = safeLocalPath(url.pathname);
      if (!filePath) {
        response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Forbidden");
        return;
      }

      const fileStat = await stat(filePath);
      if (fileStat.isDirectory()) filePath = join(filePath, "index.html");
      const finalStat = await stat(filePath);
      if (!finalStat.isFile()) throw new Error("Not a file");

      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Length": finalStat.size,
        "Content-Type": MIME_TYPES[extname(filePath)] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      });
      createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  });

  await new Promise((resolveListening, rejectListening) => {
    server.once("error", rejectListening);
    server.listen(parsedPort, "127.0.0.1", () => {
      server.off("error", rejectListening);
      const address = server.address();
      const activePort = typeof address === "object" && address ? address.port : parsedPort;
      log(`BuildTrace Viewer: http://localhost:${activePort}`);
      log("Source: docs/buildtrace/BUILDTRACE.md");
      resolveListening();
    });
  });

  const close = () => server.close(() => process.exit(0));
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
}

async function copyWithoutOverwrite(source, destination) {
  if (existsSync(destination)) {
    log(`↷ kept ${relative(process.cwd(), destination)}`);
    return false;
  }
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
  log(`✓ created ${relative(process.cwd(), destination)}`);
  return true;
}

async function writeWithoutOverwrite(destination, content) {
  if (existsSync(destination)) {
    log(`↷ kept ${relative(process.cwd(), destination)}`);
    return false;
  }
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content, { encoding: "utf8", flag: "wx" });
  log(`✓ created ${relative(process.cwd(), destination)}`);
  return true;
}

async function init() {
  const targetOption = getOption("--target", null);
  if (!targetOption) throw new Error("init requires --target /path/to/project");
  const target = resolve(targetOption);
  const targetStat = await stat(target).catch(() => null);
  if (!targetStat?.isDirectory()) throw new Error(`target directory does not exist: ${target}`);

  const files = [
    ["docs/buildtrace/SKILL.md", "docs/buildtrace/SKILL.md"],
    ["docs/buildtrace/viewer/index.html", "docs/buildtrace/viewer/index.html"],
    ["docs/buildtrace/viewer/styles.css", "docs/buildtrace/viewer/styles.css"],
    ["docs/buildtrace/viewer/app.js", "docs/buildtrace/viewer/app.js"],
    ["docs/buildtrace/viewer/parser.js", "docs/buildtrace/viewer/parser.js"],
    ["docs/buildtrace/viewer/parser.mjs", "docs/buildtrace/viewer/parser.mjs"],
    ["docs/buildtrace/viewer/serve.mjs", "docs/buildtrace/viewer/serve.mjs"],
    ["bin/buildtrace.mjs", "bin/buildtrace.mjs"],
  ];

  const today = new Date().toISOString().slice(0, 10);
  const sourceTemplate = await readFile(join(root, "templates/BUILDTRACE.md"), "utf8");
  const initializedSource = sourceTemplate
    .replace("# 项目名称", `# ${basename(target)}`)
    .replace("YYYY-MM-DD — 第一条项目记录", `${today} — BuildTrace 初始化`)
    .replace("来源可信度: confirmed\n依据: 本轮对话", "来源可信度: confirmed\n依据: BuildTrace init");

  let created = Number(
    await writeWithoutOverwrite(join(target, "docs/buildtrace/BUILDTRACE.md"), initializedSource),
  );
  for (const [source, destination] of files) {
    created += Number(await copyWithoutOverwrite(join(root, source), join(target, destination)));
  }

  created += Number(
    await writeWithoutOverwrite(
      join(target, ".cursor/rules/buildtrace.mdc"),
      `---\ndescription: Maintain evidence-backed project memory\nalwaysApply: true\n---\n\nRead and follow docs/buildtrace/SKILL.md for meaningful work and context restoration.\n`,
    ),
  );
  const agentsInstructions = await readFile(join(root, "adapters/AGENTS.md"), "utf8");
  const agentsPath = join(target, "AGENTS.md");
  if (existsSync(agentsPath)) {
    created += Number(await writeWithoutOverwrite(join(target, "AGENTS.md.buildtrace"), agentsInstructions));
    log("! AGENTS.md already exists; merge AGENTS.md.buildtrace to activate BuildTrace for Codex.");
  } else {
    created += Number(await writeWithoutOverwrite(agentsPath, agentsInstructions));
  }

  log(`BuildTrace initialized at ${target} (${created} new file${created === 1 ? "" : "s"}).`);
  log("Run: node docs/buildtrace/viewer/serve.mjs");
}

function help() {
  log(`BuildTrace ${process.env.npm_package_version || "v1.15"}\n\nCommands:\n  buildtrace doctor\n  buildtrace serve [--port 4173]\n  buildtrace init --target /path/to/project`);
}

const command = process.argv[2] || "help";

try {
  if (command === "doctor") await doctor();
  else if (command === "serve") await serve();
  else if (command === "init") await init();
  else if (command === "help" || command === "--help" || command === "-h") help();
  else throw new Error(`unknown command: ${command}`);
} catch (error) {
  process.stderr.write(`BuildTrace: ${error.message}\n`);
  process.exitCode = 1;
}
