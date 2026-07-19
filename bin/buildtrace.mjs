#!/usr/bin/env node

import { createReadStream, existsSync } from "node:fs";
import { copyFile, cp, lstat, mkdir, readFile, readdir, readlink, stat, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { auditHistory, writeHistoryAudit } from "../docs/buildtrace/scripts/audit-history.mjs";
import { buildDecisionPlaybook, buildPublication, renderDecisionPlaybookMarkdown } from "../docs/buildtrace/scripts/derive-views.mjs";
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
  "docs/buildtrace/agents/openai.yaml",
  "docs/buildtrace/references/inspiration-and-attribution.md",
  "docs/buildtrace/references/recovery-architecture.md",
  "docs/buildtrace/references/record-schema-v2.md",
  "docs/buildtrace/references/record-schema-v3.md",
  "docs/buildtrace/scripts/audit-history.mjs",
  "docs/buildtrace/scripts/derive-views.mjs",
  "docs/buildtrace/viewer/index.html",
  "docs/buildtrace/viewer/styles.css",
  "docs/buildtrace/viewer/app.js",
  "docs/buildtrace/viewer/parser.js",
  "docs/buildtrace/viewer/parser.mjs",
  "docs/buildtrace/viewer/serve.mjs",
];

const managedProjectFiles = [
  ["docs/buildtrace/SKILL.md", "docs/buildtrace/SKILL.md"],
  ["docs/buildtrace/agents/openai.yaml", "docs/buildtrace/agents/openai.yaml"],
  ["docs/buildtrace/references/inspiration-and-attribution.md", "docs/buildtrace/references/inspiration-and-attribution.md"],
  ["docs/buildtrace/references/recovery-architecture.md", "docs/buildtrace/references/recovery-architecture.md"],
  ["docs/buildtrace/references/record-schema-v2.md", "docs/buildtrace/references/record-schema-v2.md"],
  ["docs/buildtrace/references/record-schema-v3.md", "docs/buildtrace/references/record-schema-v3.md"],
  ["docs/buildtrace/scripts/audit-history.mjs", "docs/buildtrace/scripts/audit-history.mjs"],
  ["docs/buildtrace/scripts/derive-views.mjs", "docs/buildtrace/scripts/derive-views.mjs"],
  ["docs/buildtrace/DEPLOY.md", "docs/buildtrace/DEPLOY.md"],
  ["docs/buildtrace/viewer/index.html", "docs/buildtrace/viewer/index.html"],
  ["docs/buildtrace/viewer/styles.css", "docs/buildtrace/viewer/styles.css"],
  ["docs/buildtrace/viewer/app.js", "docs/buildtrace/viewer/app.js"],
  ["docs/buildtrace/viewer/parser.js", "docs/buildtrace/viewer/parser.js"],
  ["docs/buildtrace/viewer/parser.mjs", "docs/buildtrace/viewer/parser.mjs"],
  ["docs/buildtrace/viewer/serve.mjs", "docs/buildtrace/viewer/serve.mjs"],
  ["bin/buildtrace.mjs", "bin/buildtrace.mjs"],
];

const publicRoot = join(root, "docs/buildtrace");

function getOption(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function getOptions(name) {
  const values = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) values.push(process.argv[index + 1]);
  }
  return values;
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

function isValidRecordDate(value) {
  const monthMatch = value.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const month = Number(monthMatch[2]);
    return month >= 1 && month <= 12;
  }
  const dayMatch = value.match(/^(\d{4}-\d{2}-\d{2})(?:\s+.+)?$/);
  return Boolean(dayMatch && isValidISODate(dayMatch[1]));
}

function validateRecords(entries) {
  const sourceTrustValues = new Set(["confirmed", "inferred", "unknown"]);
  const statusValues = new Set(["待观察", "有效", "无效", "不确定"]);
  const visibilityValues = new Set(["private", "team", "public"]);
  const outcomeValues = new Set(["supported", "refuted", "mixed", "inconclusive", "pending"]);
  const sceneValues = new Set([
    "feature",
    "bugfix",
    "ux-content",
    "seo-growth",
    "analytics-data",
    "monetization",
    "architecture",
    "ops-release",
    "ai-workflow",
    "decision",
  ]);
  const errors = [];

  for (const entry of entries) {
    const name = `${entry.date} — ${entry.title}`;
    if (!isValidRecordDate(entry.date)) errors.push(`${name}: invalid record date`);
    if (!sourceTrustValues.has(entry.sourceTrust)) errors.push(`${name}: invalid 来源可信度`);
    if (!entry.evidence.trim()) errors.push(`${name}: 依据 is required`);
    if (!sceneValues.has(entry.scene)) errors.push(`${name}: invalid 场景`);
    if (!visibilityValues.has(entry.visibility)) errors.push(`${name}: invalid 可见范围`);
    if (!statusValues.has(entry.status)) errors.push(`${name}: invalid 结果状态`);
    if (entry.reviewDate !== "无" && !isValidISODate(entry.reviewDate)) errors.push(`${name}: invalid 后续回看`);
    if (entry.status === "待观察" && !isValidISODate(entry.reviewDate)) errors.push(`${name}: 待观察 requires a review date`);
    const requiredSections = ["quote", "summary", "why", "changes", "technical", "result"];
    if (entry.recordId) {
      if (!/^bt-[a-z0-9-]+$/.test(entry.recordId)) errors.push(`${name}: invalid 记录 ID`);
      if (!entry.sourceCoverage.trim()) errors.push(`${name}: 来源覆盖 is required for schema v2 records`);
      requiredSections.push("agentUnderstanding", "agentPlan", "executionTrace");
    }
    for (const section of requiredSections) {
      if (!entry.sections[section]?.trim()) errors.push(`${name}: ${section} section is required`);
    }
    for (const principle of entry.decisionPrinciples || []) {
      if (!/^dp-[a-z0-9-]+$/.test(principle.id)) errors.push(`${name}: invalid 决策原则 ID ${principle.id}`);
      if (!principle.text.trim()) errors.push(`${name}: 决策原则 ${principle.id} requires text`);
    }
    for (const outcome of entry.outcomes || []) {
      if (!outcomeValues.has(outcome.judgment)) errors.push(`${name}: invalid 结果判断 ${outcome.judgment}`);
      if (outcome.date && !isValidISODate(outcome.date)) errors.push(`${name}: invalid 结果判断日期 ${outcome.date}`);
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

async function ensurePrivateBuildtraceIgnore(target) {
  const privateRoot = join(target, ".buildtrace");
  const ignorePath = join(privateRoot, ".gitignore");
  const privateRootStat = await lstat(privateRoot).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (privateRootStat?.isSymbolicLink() || (privateRootStat && !privateRootStat.isDirectory())) {
    throw new Error("refusing to use unsafe .buildtrace path");
  }
  if (!privateRootStat) await mkdir(privateRoot, { recursive: true });
  const ignoreStat = await lstat(ignorePath).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (ignoreStat?.isSymbolicLink() || (ignoreStat && !ignoreStat.isFile())) {
    throw new Error("refusing to replace unsafe .buildtrace/.gitignore");
  }
  const existing = await readFile(ignorePath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  const lines = existing.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let changed = false;
  for (const required of ["backups/", "recovery/"]) {
    if (!lines.includes(required)) {
      lines.push(required);
      changed = true;
    }
  }
  if (changed || !existing) await writeFile(ignorePath, `${lines.join("\n")}\n`, "utf8");
}

async function init() {
  const targetOption = getOption("--target", null);
  if (!targetOption) throw new Error("init requires --target /path/to/project");
  const target = resolve(targetOption);
  const targetStat = await stat(target).catch(() => null);
  if (!targetStat?.isDirectory()) throw new Error(`target directory does not exist: ${target}`);

  const recoveryReport = await recoverHistory(target);
  const matchedThreads = recoveryReport.coverage.codexLocalRollouts.matchedThreadCount;
  const matchedRollouts = recoveryReport.coverage.codexLocalRollouts.matchedRolloutCount;
  const exactMessages = recoveryReport.totals.exactUserMessages || 0;
  const compactedWindows = recoveryReport.totals.compactedWindows || 0;
  const today = new Date().toISOString().slice(0, 10);
  const sourceTemplate = await readFile(join(root, "templates/BUILDTRACE.md"), "utf8");
  const initializedSource = sourceTemplate
    .replace("# 项目名称", `# ${basename(target)}`)
    .replace("YYYY-MM-DD — 第一条项目记录", `${today} — BuildTrace 初始化`)
    .replace("bt-YYYYMMDD-first-record", `bt-${today.replaceAll("-", "")}-buildtrace-init`)
    .replace("来源覆盖: current-turn", "来源覆盖: buildtrace-init, local-rollout-audit, git, project-files")
    .replace("依据: 本轮对话", `依据: BuildTrace init；.buildtrace/recovery/latest.json（${matchedRollouts} 个匹配 rollout 来源、${matchedThreads} 个唯一 Codex 任务、${exactMessages} 条去重用户消息引用、${compactedWindows} 个 compact 窗口）`)
    .replace("[Q1 | user | current-turn | verbatim]", "[Q1 | system | buildtrace-init | artifact-evidence]")
    .replace("用户与这条记录有关的完整原话；保留换行，不改写、不合并。无法取得原文时明确使用 compacted-summary、artifact-evidence 或 unavailable。", "BuildTrace init 创建项目记忆结构并生成私有历史恢复清单；本条不是用户原话。")
    .replace("[R1 <- Q1] 第一件需求，按 Agent 当时的理解记录。", "[R1 <- Q1] 为现有项目建立唯一 Markdown 主源、只读 Viewer 与项目级自动记录规则。")
    .replace("[R2 <- Q1] 第二件需求；没有第二件就删除本行，不要补写。", "[R2 <- Q1] 在继续项目工作前盘点可安全读取的旧任务、compact、多 Agent、Git 与项目证据。")
    .replace("[U1 <- R1,R2] Agent 接到需求时实际表达的理解；未捕捉就写“未捕捉”。", "[U1 <- R1,R2] 初始化只建立恢复入口和证据清单；相关历史仍需 Agent 分页读取、核对并提升为记录。")
    .replace("[P1 <- R1] 当时准备先做什么。", "[P1 <- R1] 安装项目主源、Skill、Viewer、规则与命令。")
    .replace("[P2 <- R2] 当时准备随后做什么。", "[P2 <- R2] 扫描本机可读历史并生成覆盖清单。")
    .replace("[E1 <- P1 | completed] 实际完成的第一步及证据。", "[E1 <- P1 | completed] 已创建未与既有文件冲突的 BuildTrace 项目文件。")
    .replace("[E2 <- P2 | changed] 计划若改变，记录实际变化和原因。", `[E2 <- P2 | completed] 已生成恢复清单：匹配 ${matchedRollouts} 个 rollout 来源、${matchedThreads} 个唯一 Codex 任务、${exactMessages} 条去重用户消息引用、${compactedWindows} 个 compact 窗口。`)
    .replace("人的动机、顾虑、假设或取舍。", "让后续 Agent 能先恢复项目因果，再继续实施。")
    .replace("项目实际发生的变化。", "完成 BuildTrace 项目级初始化与历史证据盘点。")
    .replace("文件、命令、commit、验证或数据来源。", "docs/buildtrace/；.buildtrace/recovery/latest.json；BuildTrace init。")
    .replace("待回看或后续结论。", "初始化完成；历史内容的逐条映射仍需 Agent 继续完成。");

  let created = Number(
    await writeWithoutOverwrite(join(target, "docs/buildtrace/BUILDTRACE.md"), initializedSource),
  );
  for (const [source, destination] of managedProjectFiles) {
    created += Number(await copyWithoutOverwrite(join(root, source), join(target, destination)));
  }

  created += Number(
    await writeWithoutOverwrite(
      join(target, ".cursor/rules/buildtrace.mdc"),
      `---\ndescription: Maintain evidence-backed project memory\nalwaysApply: true\n---\n\nDo not wait for fixed commands. Infer intent, concerns, tradeoffs, evidence, and outcomes from the user's ordinary natural language. Restore relevant context before meaningful work and record completed meaningful work in the same turn. Ask only when missing information would change the factual judgment.\n\nOn first install or backfill, audit every safe readable task, compact residue, fork or subagent trace, Git branch, project artifact, and provided export. Preserve complete relevant user messages, itemized requirements, Agent understanding, the original plan, and the actual execution trace as separate layers.\n\nRead and follow docs/buildtrace/SKILL.md for meaningful work and context restoration.\n`,
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

async function recoverHistory(targetOverride = null) {
  const target = resolve(targetOverride || getOption("--target", process.cwd()));
  const targetStat = await stat(target).catch(() => null);
  if (!targetStat?.isDirectory()) throw new Error(`target directory does not exist: ${target}`);
  const codexHome = resolve(getOption("--codex-home", join(homedir(), ".codex")));
  const report = await auditHistory({ target, codexHome });
  const destination = await writeHistoryAudit(report, target);
  const matched = report.coverage.codexLocalRollouts.matchedThreadCount;
  const matchedRollouts = report.coverage.codexLocalRollouts.matchedRolloutCount;
  const exactMessages = report.totals.exactUserMessages || 0;
  const compacted = report.totals.compactedWindows || 0;
  log(`✓ recovery audit: ${matchedRollouts} rollout source${matchedRollouts === 1 ? "" : "s"}, ${matched} unique Codex thread${matched === 1 ? "" : "s"}, ${exactMessages} deduplicated user message${exactMessages === 1 ? "" : "s"}, ${compacted} compacted window${compacted === 1 ? "" : "s"}`);
  log(`  manifest ${destination}`);
  log("! The Agent must still page matching app tasks and promote relevant evidence into BUILDTRACE.md.");
  return report;
}

async function exportProject() {
  const target = resolve(getOption("--target", process.cwd()));
  const format = getOption("--format", "json");
  if (!["json", "jsonl"].includes(format)) throw new Error("export --format must be json or jsonl");
  const sourcePath = join(target, "docs/buildtrace/BUILDTRACE.md");
  const markdown = await readFile(sourcePath, "utf8");
  const trace = parseBuildtrace(markdown);
  let payload;

  if (format === "json") {
    payload = `${JSON.stringify({ schemaVersion: 3, source: "docs/buildtrace/BUILDTRACE.md", ...trace }, null, 2)}\n`;
  } else {
    const { entries, ...project } = trace;
    const rows = [
      { type: "project", schemaVersion: 3, source: "docs/buildtrace/BUILDTRACE.md", ...project },
      ...entries.map((entry) => ({ type: "record", schemaVersion: 3, ...entry })),
    ];
    payload = `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
  }

  const outputOption = getOption("--output", null);
  if (!outputOption || outputOption === "-") {
    process.stdout.write(payload);
    return;
  }

  const destination = resolve(outputOption);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, payload, { encoding: "utf8", flag: "wx" });
  log(`✓ exported ${format} to ${destination}`);
}

async function ensureEmptyOutput(destination) {
  const outputStat = await stat(destination).catch(() => null);
  if (!outputStat) {
    await mkdir(destination, { recursive: true });
    return;
  }
  if (!outputStat.isDirectory()) throw new Error(`output is not a directory: ${destination}`);
  const existing = await readdir(destination);
  if (existing.length) throw new Error(`refusing to write into non-empty output directory: ${destination}`);
}

function publicationIndex(title) {
  const safeTitle = String(title || "BuildTrace").replace(/[<>&"']/g, "");
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0;url=./viewer/" />
    <title>${safeTitle} · BuildTrace</title>
  </head>
  <body><p><a href="./viewer/">打开 BuildTrace Viewer</a></p></body>
</html>
`;
}

async function publishProject() {
  const target = resolve(getOption("--target", process.cwd()));
  const profile = getOption("--profile", null);
  const outputOption = getOption("--output", null);
  if (!["team", "public"].includes(profile)) throw new Error("publish requires --profile team or public");
  if (!outputOption) throw new Error("publish requires --output /path/to/empty-directory");

  const sourcePath = join(target, "docs/buildtrace/BUILDTRACE.md");
  const markdown = await readFile(sourcePath, "utf8");
  const trace = parseBuildtrace(markdown);
  const generatedAt = new Date().toISOString();
  const publication = buildPublication(trace, profile, generatedAt);
  const destination = resolve(outputOption);
  await ensureEmptyOutput(destination);
  await cp(join(target, "docs/buildtrace/viewer"), join(destination, "viewer"), { recursive: true });
  await writeFile(join(destination, "BUILDTRACE.md"), publication.markdown, { encoding: "utf8", flag: "wx" });
  await writeFile(join(destination, "index.html"), publicationIndex(trace.title), { encoding: "utf8", flag: "wx" });
  await writeFile(join(destination, "PUBLISH-MANIFEST.json"), `${JSON.stringify({
    schemaVersion: 1,
    profile,
    generatedAt,
    sourceRecordCount: publication.sourceRecordCount,
    publishedRecordCount: publication.publishedRecordCount,
    redactions: publication.redactions,
  }, null, 2)}\n`, { encoding: "utf8", flag: "wx" });

  log(`✓ ${profile} snapshot: ${publication.publishedRecordCount}/${publication.sourceRecordCount} record(s)`);
  log(`  output ${destination}`);
  if (profile === "team") log("! Put this snapshot behind access control before sharing it with a team.");
  else log("✓ Original words, private/team records, internal process, resources, and paths were removed before publication.");
}

async function readProjectTrace(targetOption) {
  const input = resolve(targetOption);
  const inputStat = await stat(input).catch(() => null);
  if (!inputStat) throw new Error(`playbook target does not exist: ${input}`);
  const sourcePath = inputStat.isDirectory() ? join(input, "docs/buildtrace/BUILDTRACE.md") : input;
  const markdown = await readFile(sourcePath, "utf8");
  const trace = parseBuildtrace(markdown);
  return { name: trace.title || basename(inputStat.isDirectory() ? input : dirname(sourcePath)), trace };
}

async function generatePlaybook() {
  const targets = getOptions("--target");
  const inputs = targets.length ? targets : [process.cwd()];
  const projects = await Promise.all(inputs.map(readProjectTrace));
  const playbook = buildDecisionPlaybook(projects);
  const format = getOption("--format", "md");
  if (!["md", "json"].includes(format)) throw new Error("playbook --format must be md or json");
  const generatedAt = new Date().toISOString();
  const payload = format === "json"
    ? `${JSON.stringify({ ...playbook, generatedAt }, null, 2)}\n`
    : renderDecisionPlaybookMarkdown(playbook, generatedAt);
  const outputOption = getOption("--output", null);
  if (!outputOption || outputOption === "-") {
    process.stdout.write(payload);
    return;
  }
  const destination = resolve(outputOption);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, payload, { encoding: "utf8", flag: "wx" });
  log(`✓ personal decision playbook: ${playbook.repeatedCount} repeated, ${playbook.conflictCount} conflict(s), ${playbook.principleCount} total`);
  log(`  output ${destination}`);
}

async function syncProject() {
  const targetOption = getOption("--target", null);
  if (!targetOption) throw new Error("sync requires --target /path/to/project");
  const target = resolve(targetOption);
  const targetStat = await stat(target).catch(() => null);
  if (!targetStat?.isDirectory()) throw new Error(`target directory does not exist: ${target}`);

  await ensurePrivateBuildtraceIgnore(target);
  const backupsDirectory = join(target, ".buildtrace", "backups");
  const backupsStat = await lstat(backupsDirectory).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (backupsStat?.isSymbolicLink() || (backupsStat && !backupsStat.isDirectory())) {
    throw new Error("refusing to use unsafe .buildtrace/backups path");
  }
  if (!backupsStat) await mkdir(backupsDirectory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupRoot = join(backupsDirectory, timestamp);
  let updated = 0;
  let created = 0;
  let kept = 0;
  let backedUp = 0;

  for (const [sourcePath, destinationPath] of managedProjectFiles) {
    const source = join(root, sourcePath);
    const destination = join(target, destinationPath);
    const sourceContent = await readFile(source);
    const destinationStat = await lstat(destination).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (destinationStat?.isSymbolicLink()) {
      throw new Error(`refusing to replace managed symlink: ${relative(target, destination)}`);
    }
    const existing = destinationStat ? await readFile(destination) : null;

    if (existing && Buffer.compare(existing, sourceContent) === 0) {
      kept += 1;
      log(`↷ current ${relative(target, destination)}`);
      continue;
    }

    if (existing) {
      const backup = join(backupRoot, destinationPath);
      await mkdir(dirname(backup), { recursive: true });
      await copyFile(destination, backup);
      backedUp += 1;
    }

    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
    if (existing) {
      updated += 1;
      log(`✓ updated ${relative(target, destination)}`);
    } else {
      created += 1;
      log(`✓ created ${relative(target, destination)}`);
    }
  }

  log(`BuildTrace synced at ${target}: ${updated} updated, ${created} created, ${kept} current.`);
  if (backedUp) log(`Previous managed files backed up to ${backupRoot}`);
  log("Project facts were not touched: docs/buildtrace/BUILDTRACE.md and AGENTS.md were kept.");
}

async function createDeployKit() {
  const target = resolve(getOption("--target", process.cwd()));
  const provider = getOption("--provider", null);
  const targetStat = await stat(target).catch(() => null);
  if (!targetStat?.isDirectory()) throw new Error(`target directory does not exist: ${target}`);
  if (provider !== "github-pages") {
    throw new Error("deploy-kit currently supports --provider github-pages");
  }

  const destination = join(target, ".github", "workflows", "buildtrace-pages.yml");
  const created = await copyWithoutOverwrite(join(root, "templates", "buildtrace-pages.yml"), destination);
  if (created) {
    log("The workflow generates a public snapshot and never uploads the private BUILDTRACE.md directly.");
    log("Only records explicitly marked 可见范围: public will be included.");
    log("Then enable GitHub Pages with GitHub Actions as the publishing source.");
  }
}

async function installCodexSkill() {
  const destination = resolve(
    getOption("--dest", join(homedir(), ".agents", "skills", "buildtrace")),
  );
  const source = join(root, "docs/buildtrace");

  await mkdir(dirname(destination), { recursive: true });
  const existing = await lstat(destination).catch(() => null);
  if (existing) {
    if (existing.isSymbolicLink()) {
      const currentTarget = resolve(dirname(destination), await readlink(destination));
      if (currentTarget === source) {
        log(`✓ BuildTrace Codex Skill is already linked to ${source}`);
        return;
      }
    }
    throw new Error(`refusing to overwrite existing Skill folder: ${destination}`);
  }

  await symlink(source, destination, "dir");
  log(`✓ linked ${destination}`);
  log(`  source ${source}`);
  log("Updates to the repository Skill folder are now reflected in the local Codex Skill.");
}

function help() {
  log(`BuildTrace ${process.env.npm_package_version || "v1.17"}\n\nCommands:\n  buildtrace doctor [--target /path/to/project]\n  buildtrace serve [--port 4173]\n  buildtrace init --target /path/to/project\n  buildtrace recover [--target /path/to/project] [--codex-home /path/to/.codex]\n  buildtrace export [--target /path/to/project] [--format json|jsonl] [--output /path]\n  buildtrace playbook [--target /project/a --target /project/b] [--format md|json] [--output /path]\n  buildtrace publish --profile team|public [--target /path/to/project] --output /empty/directory\n  buildtrace sync --target /path/to/project\n  buildtrace deploy-kit --provider github-pages [--target /path/to/project]\n  buildtrace install-codex-skill [--dest /path/to/skill]`);
}

const command = process.argv[2] || "help";

try {
  if (command === "doctor") await doctor(resolve(getOption("--target", root)));
  else if (command === "serve") await serve();
  else if (command === "init") await init();
  else if (command === "recover") await recoverHistory();
  else if (command === "export") await exportProject();
  else if (command === "playbook") await generatePlaybook();
  else if (command === "publish") await publishProject();
  else if (command === "sync") await syncProject();
  else if (command === "deploy-kit") await createDeployKit();
  else if (command === "install-codex-skill") await installCodexSkill();
  else if (command === "help" || command === "--help" || command === "-h") help();
  else throw new Error(`unknown command: ${command}`);
} catch (error) {
  process.stderr.write(`BuildTrace: ${error.message}\n`);
  process.exitCode = 1;
}
