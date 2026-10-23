#!/usr/bin/env node

import { createReadStream, existsSync } from "node:fs";
import { appendFile, copyFile, cp, lstat, mkdir, readFile, readdir, readlink, realpath, rename, stat, symlink, unlink, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { auditHistory, writeHistoryAudit } from "../docs/buildtrace/scripts/audit-history.mjs";
import { buildDecisionPlaybook, buildPublication, renderDecisionPlaybookMarkdown } from "../docs/buildtrace/scripts/derive-views.mjs";
import { parseBuildtrace } from "../docs/buildtrace/viewer/parser.mjs";
import { buildContextMarkdown } from "../docs/buildtrace/viewer/reading-model.mjs";
import { serveOverview } from "../docs/buildtrace/scripts/overview.mjs";
import { discoverProjects } from "../docs/buildtrace/scripts/discover-projects.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = join(root, "skill", "buildtrace");
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
  "docs/buildtrace/references/classification-and-capture.md",
  "docs/buildtrace/references/matters-and-reading.md",
  "docs/buildtrace/references/record-schema-v2.md",
  "docs/buildtrace/references/record-schema-v3.md",
  "docs/buildtrace/scripts/audit-history.mjs",
  "docs/buildtrace/scripts/derive-views.mjs",
  "docs/buildtrace/scripts/overview.mjs",
  "docs/buildtrace/scripts/discover-projects.mjs",
  "docs/buildtrace/viewer/index.html",
  "docs/buildtrace/viewer/styles.css",
  "docs/buildtrace/viewer/app.js",
  "docs/buildtrace/viewer/parser.js",
  "docs/buildtrace/viewer/parser.mjs",
  "docs/buildtrace/viewer/reading-model.mjs",
  "docs/buildtrace/viewer/serve.mjs",
];

const managedProjectFiles = [
  ["docs/buildtrace/SKILL.md", "docs/buildtrace/SKILL.md"],
  ["docs/buildtrace/agents/openai.yaml", "docs/buildtrace/agents/openai.yaml"],
  ["docs/buildtrace/references/inspiration-and-attribution.md", "docs/buildtrace/references/inspiration-and-attribution.md"],
  ["docs/buildtrace/references/recovery-architecture.md", "docs/buildtrace/references/recovery-architecture.md"],
  ["docs/buildtrace/references/classification-and-capture.md", "docs/buildtrace/references/classification-and-capture.md"],
  ["docs/buildtrace/references/record-schema-v2.md", "docs/buildtrace/references/record-schema-v2.md"],
  ["docs/buildtrace/references/record-schema-v3.md", "docs/buildtrace/references/record-schema-v3.md"],
  ["docs/buildtrace/scripts/audit-history.mjs", "docs/buildtrace/scripts/audit-history.mjs"],
  ["docs/buildtrace/scripts/derive-views.mjs", "docs/buildtrace/scripts/derive-views.mjs"],
  ["docs/buildtrace/scripts/overview.mjs", "docs/buildtrace/scripts/overview.mjs"],
  ["docs/buildtrace/scripts/discover-projects.mjs", "docs/buildtrace/scripts/discover-projects.mjs"],
  ["docs/buildtrace/DEPLOY.md", "docs/buildtrace/DEPLOY.md"],
  ["docs/buildtrace/viewer/index.html", "docs/buildtrace/viewer/index.html"],
  ["docs/buildtrace/viewer/styles.css", "docs/buildtrace/viewer/styles.css"],
  ["docs/buildtrace/viewer/app.js", "docs/buildtrace/viewer/app.js"],
  ["docs/buildtrace/viewer/parser.js", "docs/buildtrace/viewer/parser.js"],
  ["docs/buildtrace/viewer/parser.mjs", "docs/buildtrace/viewer/parser.mjs"],
  ["docs/buildtrace/viewer/reading-model.mjs", "docs/buildtrace/viewer/reading-model.mjs"],
  ["docs/buildtrace/references/matters-and-reading.md", "docs/buildtrace/references/matters-and-reading.md"],
  ["adapters/buildtrace-AGENTS.md", "docs/buildtrace/AGENTS.md"],
  ["docs/buildtrace/viewer/serve.mjs", "docs/buildtrace/viewer/serve.mjs"],
  ["bin/buildtrace.mjs", "bin/buildtrace.mjs"],
];

const projectAdapters = [
  ["adapters/AGENTS.md", "AGENTS.md", true],
  ["adapters/cursor-rule.mdc", ".cursor/rules/buildtrace.mdc", false],
  ["adapters/CLAUDE.md", "CLAUDE.md", true],
  ["adapters/copilot-instructions.md", ".github/copilot-instructions.md", true],
  ["adapters/GEMINI.md", "GEMINI.md", true],
  ["adapters/windsurf-rule.md", ".windsurf/rules/buildtrace.md", false],
];

const AUTO_BLOCK_START = "<!-- buildtrace:auto:start -->";
const AUTO_BLOCK_END = "<!-- buildtrace:auto:end -->";
const PROJECT_ADAPTER_BLOCK_START = "<!-- buildtrace:project-adapter:start -->";
const PROJECT_ADAPTER_BLOCK_END = "<!-- buildtrace:project-adapter:end -->";
const globalInstructionTargets = [
  [".codex/AGENTS.md", "Codex"],
  [".claude/CLAUDE.md", "Claude Code"],
  [".copilot/copilot-instructions.md", "GitHub Copilot"],
  [".codeium/windsurf/memories/global_rules.md", "Windsurf"],
  [".gemini/GEMINI.md", "Gemini CLI"],
];

function globalAutoInstructions(agentName) {
  return `${AUTO_BLOCK_START}
## BuildTrace automatic project memory

The user enabled BuildTrace for future projects in ${agentName}. At the start of meaningful work in a writable project:

1. Locate the project root. If \`docs/buildtrace/BUILDTRACE.md\` is absent, run \`buildtrace init --target "<absolute-project-root>"\` before implementation. Do not initialize read-only reviews, temporary folders, dependencies, or projects whose instructions opt out.
2. Read \`docs/buildtrace/SKILL.md\`, the project purpose, recent and relevant records, and due follow-ups.
3. Before changing an existing archive, run \`buildtrace snapshot --target "<absolute-project-root>"\`. After the edit, run \`buildtrace verify-history --target "<absolute-project-root>"\`. Preserve existing quotes, interpretations, plans, and execution text; corrections append evidence instead of silently rewriting history.
4. After a meaningful feature, fix, design, architecture, release, operational action, or important decision, update the Markdown source in the same turn. Ordinary natural language is enough; do not wait for a fixed command. Verify the file afterwards and include its path and the saved record ID/title in the handoff. Reading rules or running init does not mean the current work was recorded.
5. On first initialization of an existing project, continue from \`.buildtrace/recovery/latest.json\`: inspect every safe accessible matching task, compact trace, fork or subagent lineage, Git branch, project artifact, and authorized export. State what was searched, mapped, unavailable, and still unresolved.
6. Never copy another project's records into the new project. The installed Skill contains rules only; project facts belong only in that project's \`docs/buildtrace/BUILDTRACE.md\`.
7. Project memory is not a chat dump: keep substantive decisions, constraints, actions and evidence, not routine progress nudges. Follow project classification and capture rules; retain full details, separate summaries from exact words, and verify the project, record ID and worktree before any backfill or outcome update. Agent understanding means contemporaneous public statements, never private reasoning or hindsight.

If the \`buildtrace\` command is unavailable, tell the user to install it from https://github.com/yimleunggggg/Buildtrace instead of silently skipping initialization.
${AUTO_BLOCK_END}
`;
}

const blockedLocalSegments = new Set([".git", ".buildtrace", "node_modules"]);
const allowedRootDocuments = new Set(["README.md", "README.en.md", "CHANGELOG.md", "DESIGN.md", "LICENSE", "LICENSE.md"]);

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

function contentHash(content) {
  return createHash("sha256").update(content).digest("hex");
}

function sourceHistoryLabel(target, source) {
  return isInsidePath(target, source) ? relative(target, source) : basename(source);
}

async function resolveProjectSource(target) {
  const source = resolve(getOption("--source", join(target, "docs/buildtrace/BUILDTRACE.md")));
  const sourceStat = await lstat(source).catch(() => null);
  if (!sourceStat?.isFile() || sourceStat.isSymbolicLink()) {
    throw new Error(`BuildTrace source is not a safe file: ${source}`);
  }
  return source;
}

async function writeSourceSnapshot(target, source, content, reason = "manual") {
  await ensurePrivateBuildtraceIgnore(target);
  const historyRoot = join(target, ".buildtrace", "history");
  await assertSafeProjectWritePath(target, historyRoot);
  const historyStat = await lstat(historyRoot).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (historyStat?.isSymbolicLink() || (historyStat && !historyStat.isDirectory())) {
    throw new Error("refusing to use unsafe .buildtrace/history path");
  }
  if (!historyStat) await mkdir(historyRoot, { recursive: true });

  const hash = contentHash(content);
  const snapshotName = `${hash}.md`;
  const snapshotPath = join(historyRoot, snapshotName);
  const snapshotStat = await lstat(snapshotPath).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (snapshotStat?.isSymbolicLink() || (snapshotStat && !snapshotStat.isFile())) {
    throw new Error(`refusing to replace unsafe history snapshot: ${snapshotName}`);
  }
  if (!snapshotStat) await writeFile(snapshotPath, content, { encoding: "utf8", flag: "wx" });

  const sourceLabel = sourceHistoryLabel(target, source);
  const event = {
    timestamp: new Date().toISOString(),
    hash,
    bytes: Buffer.byteLength(content),
    source: sourceLabel,
    reason,
  };
  const indexPath = join(historyRoot, "index.jsonl");
  await assertSafeProjectWritePath(target, indexPath);
  const indexStat = await lstat(indexPath).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (indexStat && !indexStat.isFile()) throw new Error("refusing to append to unsafe history index");
  await appendFile(indexPath, `${JSON.stringify(event)}\n`, "utf8");
  return { ...event, path: snapshotPath, created: !snapshotStat };
}

async function readHistoryEvents(target) {
  const indexPath = join(target, ".buildtrace", "history", "index.jsonl");
  const content = await readFile(indexPath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  return content.split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}

async function snapshotProject() {
  const target = resolve(getOption("--target", root));
  const source = await resolveProjectSource(target);
  const content = await readFile(source, "utf8");
  const snapshot = await writeSourceSnapshot(target, source, content, getOption("--reason", "manual"));
  log(`${snapshot.created ? "✓ saved" : "↷ already saved"} ${snapshot.hash.slice(0, 12)}  ${snapshot.source}`);
  log(`History: ${relative(target, snapshot.path)}`);
}

async function showProjectStatus() {
  const target = resolve(getOption("--target", process.cwd()));
  const source = resolve(getOption("--source", join(target, "docs/buildtrace/BUILDTRACE.md")));
  const sourceStat = await lstat(source).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (sourceStat && (!sourceStat.isFile() || sourceStat.isSymbolicLink())) throw new Error(`BuildTrace source is not a safe file: ${source}`);
  const content = sourceStat ? await readFile(source, "utf8") : "";
  const trace = content ? parseBuildtrace(content) : null;
  const entries = trace?.entries || [];
  const latest = entries.reduce((found, entry) => !found || entry.date > found.date ? entry : found, null);
  const adapters = [];
  for (const [, destination] of projectAdapters) {
    const adapterContent = await readFile(join(target, destination), "utf8").catch((error) => {
      if (error.code === "ENOENT") return "";
      throw error;
    });
    adapters.push({ path: destination, configured: /BuildTrace project memory|# BuildTrace\b/.test(adapterContent) });
  }
  const report = {
    project: trace?.title || basename(target),
    target,
    initialized: Boolean(sourceStat),
    source,
    records: entries.length,
    latest: latest ? { id: latest.recordId || latest.id, title: latest.title, date: latest.date } : null,
    modifiedAt: sourceStat?.mtime.toISOString() || null,
    sha256: sourceStat ? contentHash(content) : null,
    adapters,
    capture: "agent-written",
    note: "Rule configuration does not prove the Agent loaded it or saved every session. This status describes the file on disk, not live conversation capture.",
  };
  if (process.argv.includes("--json")) {
    log(JSON.stringify(report, null, 2));
    return;
  }
  log(`Project: ${report.project}`);
  log(`Archive: ${report.initialized ? report.source : "not initialized"}`);
  log(`Records: ${report.records}`);
  if (latest) log(`Latest: ${latest.date} — ${latest.title}\nRecord ID: ${report.latest.id}`);
  if (report.sha256) log(`File SHA-256: ${report.sha256}\nFile saved: ${report.modifiedAt}`);
  log(`Project rules: ${adapters.filter((item) => item.configured).map((item) => item.path).join(", ") || "none found"}`);
  log("Recording: the working Agent writes the archive; continuous conversation capture is not installed.");
  if (!report.initialized) log(`Next: buildtrace init --target "${target}"`);
  else log(`View: buildtrace serve --target "${target}"${getOption("--source", null) ? ` --source "${source}"` : ""}`);
}

async function showProjectHistory() {
  const target = resolve(getOption("--target", root));
  const events = await readHistoryEvents(target);
  if (!events.length) {
    log("No BuildTrace history snapshots yet. Run: buildtrace snapshot --target .");
    return;
  }
  const seen = new Set();
  for (const event of [...events].reverse()) {
    if (seen.has(event.hash)) continue;
    seen.add(event.hash);
    log(`${event.timestamp}  ${event.hash.slice(0, 12)}  ${event.bytes} bytes  ${event.reason || "unknown"}  ${event.source || "BUILDTRACE.md"}`);
  }
}

function quoteAuditProblems(trace) {
  const problems = [];
  const fidelityValues = new Set(["verbatim", "compacted-summary", "artifact-evidence", "unavailable"]);
  for (const entry of trace.entries) {
    const name = entry.recordId || `${entry.date} — ${entry.title}`;
    if (!entry.quotes.length) {
      problems.push({ severity: "missing", message: `${name}: no original-message evidence` });
      continue;
    }
    for (const quote of entry.quotes) {
      if (quote.speaker !== "user") problems.push({ severity: "warning", message: `${name}/${quote.id}: speaker is not user` });
      if (!quote.sourceRef) problems.push({ severity: "missing", message: `${name}/${quote.id}: source reference is missing` });
      if (!fidelityValues.has(quote.fidelity)) problems.push({ severity: "missing", message: `${name}/${quote.id}: fidelity must be verbatim, compacted-summary, artifact-evidence, or unavailable` });
      if (quote.fidelity === "verbatim" && !quote.text.trim()) problems.push({ severity: "missing", message: `${name}/${quote.id}: verbatim text is empty` });
      if (quote.fidelity !== "verbatim") problems.push({ severity: "partial", message: `${name}/${quote.id}: original words are not available (${quote.fidelity})` });
    }
  }
  return problems;
}

async function auditProjectQuotes() {
  const target = resolve(getOption("--target", root));
  const source = await resolveProjectSource(target);
  const trace = parseBuildtrace(await readFile(source, "utf8"));
  const problems = quoteAuditProblems(trace);
  for (const problem of problems) log(`${problem.severity === "missing" ? "✗" : "!"} ${problem.message}`);
  const complete = trace.entries.length - new Set(problems.map((problem) => problem.message.split(":")[0])).size;
  log(`Quote audit: ${complete}/${trace.entries.length} records have only traceable verbatim user messages.`);
  if (problems.some((problem) => problem.severity === "missing")) {
    throw new Error("quote audit found missing or malformed provenance; do not invent text—recover it or mark it unavailable");
  }
}

function protectedRecordProblems(beforeTrace, afterTrace) {
  const problems = [];
  const afterById = new Map(afterTrace.entries.filter((entry) => entry.recordId).map((entry) => [entry.recordId, entry]));
  const protectedSections = ["quote", "summary", "agentUnderstanding", "agentPlan", "executionTrace", "discussion", "delivery", "feedback", "why", "changes"];
  for (const before of beforeTrace.entries.filter((entry) => entry.recordId)) {
    const after = afterById.get(before.recordId);
    if (!after) {
      problems.push(`${before.recordId}: existing record was removed or its stable ID changed`);
      continue;
    }
    if (before.date !== after.date) problems.push(`${before.recordId}: record date changed (${before.date} -> ${after.date})`);
    for (const section of protectedSections) {
      const oldText = before.sections[section]?.trim();
      const newText = after.sections[section]?.trim() || "";
      if (oldText && !newText.includes(oldText)) problems.push(`${before.recordId}: existing ${section} text was removed or rewritten`);
    }
  }
  return problems;
}

async function verifyProjectHistory() {
  const target = resolve(getOption("--target", root));
  const source = await resolveProjectSource(target);
  const current = await readFile(source, "utf8");
  const sourceLabel = sourceHistoryLabel(target, source);
  const events = (await readHistoryEvents(target)).filter((event) => event.source === sourceLabel);
  const currentHash = contentHash(current);
  const baseline = [...events].reverse().find((event) => event.hash !== currentHash) || events.at(-1);
  if (!baseline) throw new Error("no history baseline; run buildtrace snapshot before editing");
  const before = await readFile(join(target, ".buildtrace", "history", `${baseline.hash}.md`), "utf8");
  const problems = protectedRecordProblems(parseBuildtrace(before), parseBuildtrace(current));
  if (problems.length) {
    for (const problem of problems) log(`✗ ${problem}`);
    throw new Error(`${problems.length} protected history change(s) detected; use a correction record or restore a snapshot`);
  }
  log(`✓ no existing records or preserved reasoning were removed since ${baseline.hash.slice(0, 12)}`);
  log(`Current: ${currentHash.slice(0, 12)}`);
}

async function restoreProjectSnapshot() {
  const target = resolve(getOption("--target", root));
  const requested = getOption("--snapshot", null);
  if (!requested) throw new Error("restore requires --snapshot <hash-prefix>");
  if (!process.argv.includes("--confirm")) throw new Error("restore is destructive; inspect buildtrace history, then add --confirm");
  const source = await resolveProjectSource(target);
  const sourceLabel = sourceHistoryLabel(target, source);
  const events = (await readHistoryEvents(target)).filter((event) => event.source === sourceLabel);
  const matches = [...new Set(events.map((event) => event.hash))].filter((hash) => hash.startsWith(requested));
  if (matches.length !== 1) throw new Error(matches.length ? "snapshot prefix is ambiguous" : "snapshot not found");
  const current = await readFile(source, "utf8");
  await writeSourceSnapshot(target, source, current, "before-restore");
  const restored = await readFile(join(target, ".buildtrace", "history", `${matches[0]}.md`), "utf8");
  await writeFile(source, restored, "utf8");
  await writeSourceSnapshot(target, source, restored, `restored-${matches[0].slice(0, 12)}`);
  log(`✓ restored ${relative(target, source)} to ${matches[0].slice(0, 12)}`);
  log("The replaced current version was preserved as a before-restore snapshot.");
}

async function doctor(base = root) {
  const missing = requiredFiles.filter((file) => !existsSync(join(base, file)));
  if (missing.length) {
    for (const file of missing) log(`✗ missing ${file}`);
    throw new Error(`${missing.length} required BuildTrace file(s) are missing`);
  }

  const markdown = await readFile(await resolveProjectSource(base), "utf8");
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
    const requiredSections = entry.recordStructure === "事项记录" ? ["summary"] : ["quote", "summary", "why", "changes", "result"];
    if (entry.recordId) {
      if (!/^bt-[a-z0-9-]+$/.test(entry.recordId)) errors.push(`${name}: invalid 记录 ID`);
      if (!entry.sourceCoverage.trim()) errors.push(`${name}: 来源覆盖 is required for schema v2 records`);
      // An old archive may genuinely lack contemporaneous AI statements.
      // Missing public process is a coverage gap, not a reason to invent it.
    }
    if (entry.matterId && !/^matter-[a-z0-9-]+$/.test(entry.matterId)) errors.push(`${name}: invalid 事项 ID`);
    if (entry.parentMatterId && !/^matter-[a-z0-9-]+$/.test(entry.parentMatterId)) errors.push(`${name}: invalid 上级事项`);
    if (entry.matterId && entry.parentMatterId === entry.matterId) errors.push(`${name}: a matter cannot be its own parent`);
    if (entry.recordStructure === "事项记录" && !entry.recordId) errors.push(`${name}: 事项记录 requires a stable 记录 ID`);
    if (entry.recordStructure === "事项记录" && !entry.quotes.length && !entry.sections.executionTrace && !entry.sections.discussion) errors.push(`${name}: at least one communication or execution evidence section is required`);
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

function safeLocalPath(pathname, base) {
  const decoded = decodeURIComponent(pathname);
  const requested = resolve(base, `.${decoded}`);
  if (requested !== base && !requested.startsWith(`${base}${sep}`)) return null;
  const segments = relative(base, requested).split(sep).filter(Boolean);
  if (segments.some((segment) => blockedLocalSegments.has(segment) || segment === ".env" || segment.startsWith(".env."))) return null;
  if (segments[0] !== "docs" && !allowedRootDocuments.has(segments.join("/"))) return null;
  return requested;
}

function isInsidePath(base, candidate) {
  return candidate === base || candidate.startsWith(`${base}${sep}`);
}

async function serve() {
  const parsedPort = Number(getOption("--port", process.env.PORT || defaultPort));
  const target = resolve(getOption("--target", root));
  const explicitSource = getOption("--source", null);
  const readOnly = process.argv.includes("--read-only");
  const sharedViewer = process.argv.includes("--shared-viewer");
  const canonicalViewer = await realpath(join(root, "docs/buildtrace/viewer"));
  const source = resolve(explicitSource || join(target, "docs/buildtrace/BUILDTRACE.md"));
  const targetStat = await stat(target).catch(() => null);
  const sourceStat = await stat(source).catch(() => null);
  if (!targetStat?.isDirectory()) throw new Error(`serve target does not exist: ${target}`);
  if (!sourceStat?.isFile()) throw new Error(`serve source does not exist: ${source}`);
  const canonicalTarget = await realpath(target);
  const canonicalSource = await realpath(source);
  if (!explicitSource && !isInsidePath(canonicalTarget, canonicalSource)) {
    throw new Error("default BuildTrace source resolves outside the serve target");
  }
  if (!Number.isInteger(parsedPort) || parsedPort < 0 || parsedPort > 65535) {
    throw new Error("--port must be an integer between 0 and 65535");
  }

  let lastSourceContent = await readFile(canonicalSource, "utf8");
  let historyAvailable = !readOnly;
  try {
    if (!readOnly) await writeSourceSnapshot(target, canonicalSource, lastSourceContent, "serve-start");
  } catch (error) {
    historyAvailable = false;
    log(`! Viewer history snapshots unavailable: ${error.message}`);
  }
  let snapshotInFlight = false;
  const snapshotTimer = setInterval(async () => {
    if (snapshotInFlight) return;
    snapshotInFlight = true;
    try {
      const nextContent = await readFile(canonicalSource, "utf8");
      if (nextContent !== lastSourceContent && historyAvailable) {
        await writeSourceSnapshot(target, canonicalSource, lastSourceContent, "before-live-change");
        await writeSourceSnapshot(target, canonicalSource, nextContent, "after-live-change");
        lastSourceContent = nextContent;
      } else if (nextContent !== lastSourceContent) {
        lastSourceContent = nextContent;
      }
    } catch {
      // Serving remains read-only even if the history directory becomes temporarily unavailable.
      historyAvailable = false;
    } finally {
      snapshotInFlight = false;
    }
  }, 2000);
  snapshotTimer.unref();

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://localhost");
      if (url.pathname === "/_buildtrace/context.json") {
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
        const gitValue = (args) => {
          const result = spawnSync("git", ["-C", canonicalTarget, ...args], { encoding: "utf8" });
          return result.status === 0 ? result.stdout.trim() : "";
        };
        response.end(JSON.stringify({ projectRoot: canonicalTarget, sourcePath: canonicalSource, branch: gitValue(["branch", "--show-current"]), repositoryUrl: gitValue(["remote", "get-url", "origin"]) }));
        return;
      }
      if (url.pathname === "/") {
        response.writeHead(302, { Location: "/docs/buildtrace/viewer/" });
        response.end();
        return;
      }

      const viewerAsset = sharedViewer && url.pathname.startsWith("/docs/buildtrace/viewer/");
      let filePath = url.pathname === "/docs/buildtrace/BUILDTRACE.md"
        ? canonicalSource
        : safeLocalPath(url.pathname, viewerAsset ? root : target);
      if (!filePath) {
        response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Forbidden");
        return;
      }

      const fileStat = await stat(filePath);
      if (fileStat.isDirectory()) filePath = join(filePath, "index.html");
      filePath = await realpath(filePath);
      if (filePath !== canonicalSource && !isInsidePath(canonicalTarget, filePath) && !(viewerAsset && isInsidePath(canonicalViewer, filePath))) {
        response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Forbidden");
        return;
      }
      const finalStat = await stat(filePath);
      if (!finalStat.isFile()) throw new Error("Not a file");

      const headers = {
        "Cache-Control": "no-store",
        "Content-Length": finalStat.size,
        "Content-Type": MIME_TYPES[extname(filePath)] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      };
      if (url.searchParams.get("download") === "1" && filePath === canonicalSource) {
        headers["Content-Disposition"] = 'attachment; filename="BUILDTRACE.md"';
      }
      response.writeHead(200, headers);
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
      log(`Source: ${canonicalSource}`);
      resolveListening();
    });
  });

  const close = () => {
    clearInterval(snapshotTimer);
    server.close(() => process.exit(0));
  };
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
}

async function assertSafeProjectWritePath(target, destination) {
  const relativePath = relative(target, destination);
  if (!relativePath || relativePath === ".") return;
  if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || resolve(destination) !== destination) {
    throw new Error(`refusing to write outside project: ${destination}`);
  }
  const targetStat = await lstat(target);
  if (targetStat.isSymbolicLink()) throw new Error(`refusing to use symlink project root: ${target}`);

  let current = target;
  for (const segment of relativePath.split(sep).filter(Boolean)) {
    current = join(current, segment);
    const currentStat = await lstat(current).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (!currentStat) break;
    if (currentStat.isSymbolicLink()) {
      throw new Error(`refusing to follow project symlink: ${relative(target, current)}`);
    }
  }
}

async function copyWithoutOverwrite(source, destination) {
  const existing = await lstat(destination).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (existing?.isSymbolicLink()) throw new Error(`refusing to follow destination symlink: ${destination}`);
  if (existing) {
    log(`↷ kept ${relative(process.cwd(), destination)}`);
    return false;
  }
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
  log(`✓ created ${relative(process.cwd(), destination)}`);
  return true;
}

async function writeWithoutOverwrite(destination, content) {
  const existing = await lstat(destination).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (existing?.isSymbolicLink()) throw new Error(`refusing to follow destination symlink: ${destination}`);
  if (existing) {
    log(`↷ kept ${relative(process.cwd(), destination)}`);
    return false;
  }
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content, { encoding: "utf8", flag: "wx" });
  log(`✓ created ${relative(process.cwd(), destination)}`);
  return true;
}

async function installProjectAdapter(target, sourcePath, destinationPath, sharedInstructionFile, backupRoot) {
  const source = join(root, sourcePath);
  const destination = join(target, destinationPath);
  await assertSafeProjectWritePath(target, destination);
  if (sharedInstructionFile) return Number(await upsertProjectAdapterBlock(target, source, destination, backupRoot));
  const destinationStat = await lstat(destination).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!destinationStat) return Number(await copyWithoutOverwrite(source, destination));
  log(`↷ kept ${relative(process.cwd(), destination)}`);
  return 0;
}

async function upsertProjectAdapterBlock(target, source, destination, backupRoot) {
  await assertSafeProjectWritePath(target, destination);
  const sourceContent = await readFile(source, "utf8");
  const block = `${PROJECT_ADAPTER_BLOCK_START}\n${sourceContent.trim()}\n${PROJECT_ADAPTER_BLOCK_END}`;
  const destinationStat = await lstat(destination).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (destinationStat?.isSymbolicLink() || (destinationStat && !destinationStat.isFile())) {
    throw new Error(`refusing to update unsafe project instruction file: ${destination}`);
  }
  const existing = destinationStat ? await readFile(destination, "utf8") : "";
  const start = existing.indexOf(PROJECT_ADAPTER_BLOCK_START);
  const end = existing.indexOf(PROJECT_ADAPTER_BLOCK_END);
  if ((start >= 0 || end >= 0) && !(start >= 0 && end > start)) {
    throw new Error(`incomplete BuildTrace instruction block: ${relative(target, destination)}`);
  }
  let next;
  if (start >= 0 && end > start) {
    next = `${existing.slice(0, start)}${block}${existing.slice(end + PROJECT_ADAPTER_BLOCK_END.length)}`;
  } else if (existing.trim() === sourceContent.trim()) {
    next = block;
  } else {
    const separator = existing.trim() ? "\n\n" : "";
    next = `${existing}${separator}${block}`;
  }
  next = `${next.trimEnd()}\n`;
  if (next === existing) {
    log(`↷ current ${relative(process.cwd(), destination)}`);
    return false;
  }
  if (destinationStat && backupRoot) {
    const backup = join(backupRoot, relative(target, destination));
    await assertSafeProjectWritePath(target, backup);
    await mkdir(dirname(backup), { recursive: true });
    await writeFile(backup, existing, { encoding: "utf8", flag: "wx" });
  }
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, next, "utf8");
  log(`✓ ${destinationStat ? "updated" : "created"} ${relative(process.cwd(), destination)}`);
  return true;
}

async function upsertManagedBlock(destination, block) {
  await mkdir(dirname(destination), { recursive: true });
  const destinationStat = await lstat(destination).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (destinationStat?.isSymbolicLink() || (destinationStat && !destinationStat.isFile())) {
    throw new Error(`refusing to update unsafe instruction file: ${destination}`);
  }
  const existing = destinationStat ? await readFile(destination, "utf8") : "";
  const start = existing.indexOf(AUTO_BLOCK_START);
  const end = existing.indexOf(AUTO_BLOCK_END);
  let next;
  if (start >= 0 && end > start) {
    next = `${existing.slice(0, start)}${block.trim()}${existing.slice(end + AUTO_BLOCK_END.length)}`;
  } else {
    const separator = existing.trim() ? "\n\n" : "";
    next = `${existing.trimEnd()}${separator}${block.trim()}`;
  }
  next = `${next.trimEnd()}\n`;
  if (next === existing) {
    log(`↷ current ${destination}`);
    return false;
  }
  await writeFile(destination, next, "utf8");
  log(`✓ activated ${destination}`);
  return true;
}

async function ensureSkillLink(destination) {
  await mkdir(dirname(destination), { recursive: true });
  const existing = await lstat(destination).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (existing) {
    if (existing.isDirectory()) {
      const existingSkill = await readFile(join(destination, "SKILL.md"), "utf8").catch(() => "");
      if (!/^name:\s*buildtrace\s*$/m.test(existingSkill)) {
        throw new Error(`refusing to overwrite existing Skill folder: ${destination}`);
      }
      const backup = `${destination}.backup-${new Date().toISOString().replace(/[:.]/g, "-")}`;
      await rename(destination, backup);
      log(`✓ backed up legacy BuildTrace Skill ${backup}`);
    } else if (!existing.isSymbolicLink()) {
      throw new Error(`refusing to overwrite existing Skill path: ${destination}`);
    }
    if (existing.isSymbolicLink()) {
      const currentTarget = resolve(dirname(destination), await readlink(destination));
      if (currentTarget === skillRoot) {
        log(`↷ current ${destination}`);
        return false;
      }
      const linkedSkill = await readFile(join(currentTarget, "SKILL.md"), "utf8").catch(() => "");
      if (!/^name:\s*buildtrace\s*$/m.test(linkedSkill)) {
        throw new Error(`refusing to replace unrelated Skill link: ${destination}`);
      }
      await unlink(destination);
      log(`✓ removed legacy project-archive Skill link ${destination}`);
    }
  }
  await symlink(skillRoot, destination, "dir");
  log(`✓ linked clean Skill ${destination}`);
  return true;
}

async function ensurePrivateBuildtraceIgnore(target) {
  const privateRoot = join(target, ".buildtrace");
  const ignorePath = join(privateRoot, ".gitignore");
  await assertSafeProjectWritePath(target, privateRoot);
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
  for (const required of ["backups/", "recovery/", "history/"]) {
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

  await ensurePrivateBuildtraceIgnore(target);
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
    .replace("依据: 本轮对话", `依据: BuildTrace init；.buildtrace/recovery/latest.json（${matchedRollouts} 个匹配 rollout 来源、${matchedThreads} 个唯一 Codex 任务、${exactMessages} 条用户消息引用（有 ID 的已去重，无 ID 的仍按出现次数计）、${compactedWindows} 个 compact 窗口）`)
    .replace("[Q1 | user | current-turn | verbatim]", "[Q1 | system | buildtrace-init | artifact-evidence]")
    .replace("用户与这条记录有关的完整原话；保留换行，不改写、不合并。无法取得原文时明确使用 compacted-summary、artifact-evidence 或 unavailable。", "BuildTrace init 创建项目记忆结构并生成私有历史恢复清单；本条不是用户原话。")
    .replace("[R1 <- Q1] 第一件需求，按 Agent 当时的理解记录。", "[R1 <- Q1] 为现有项目建立唯一 Markdown 主源、只读 Viewer 与项目级自动记录规则。")
    .replace("[R2 <- Q1] 第二件需求；没有第二件就删除本行，不要补写。", "[R2 <- Q1] 在继续项目工作前盘点可安全读取的旧任务、compact、多 Agent、Git 与项目证据。")
    .replace("[U1 <- R1,R2] Agent 接到需求时实际表达的理解；未捕捉就写“未捕捉”。", "[U1 <- R1,R2] 初始化只建立恢复入口和证据清单；相关历史仍需 Agent 分页读取、核对并提升为记录。")
    .replace("[P1 <- R1] 当时准备先做什么。", "[P1 <- R1] 安装项目主源、Skill、Viewer、规则与命令。")
    .replace("[P2 <- R2] 当时准备随后做什么。", "[P2 <- R2] 扫描本机可读历史并生成覆盖清单。")
    .replace("[E1 <- P1 | completed] 实际完成的第一步及证据。", "[E1 <- P1 | completed] 已创建未与既有文件冲突的 BuildTrace 项目文件。")
    .replace("[E2 <- P2 | changed] 计划若改变，记录实际变化和原因。", `[E2 <- P2 | completed] 已生成恢复清单：匹配 ${matchedRollouts} 个 rollout 来源、${matchedThreads} 个唯一 Codex 任务、${exactMessages} 条用户消息引用（有 ID 的已去重，无 ID 的仍按出现次数计）、${compactedWindows} 个 compact 窗口。`)
    .replace("人的动机、顾虑、假设或取舍。", "让后续 Agent 能先恢复项目因果，再继续实施。")
    .replace("项目实际发生的变化。", "完成 BuildTrace 项目级初始化与历史证据盘点。")
    .replace("文件、命令、commit、验证或数据来源。", "docs/buildtrace/；.buildtrace/recovery/latest.json；BuildTrace init。")
    .replace("待回看或后续结论。", "初始化完成；历史内容的逐条映射仍需 Agent 继续完成。");

  const projectSourcePath = join(target, "docs/buildtrace/BUILDTRACE.md");
  await assertSafeProjectWritePath(target, projectSourcePath);
  let created = Number(await writeWithoutOverwrite(projectSourcePath, initializedSource));
  for (const [source, destination] of managedProjectFiles) {
    const destinationPath = join(target, destination);
    await assertSafeProjectWritePath(target, destinationPath);
    created += Number(await copyWithoutOverwrite(join(root, source), destinationPath));
  }
  created += Number(await ensureProjectRules(target));

  const adapterBackupRoot = join(target, ".buildtrace", "backups", `init-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  for (const adapter of projectAdapters) {
    created += await installProjectAdapter(target, ...adapter, adapterBackupRoot);
  }

  log(`BuildTrace initialized at ${target} (${created} file${created === 1 ? "" : "s"} created or updated).`);
  log("Run: buildtrace serve --target .");
  log("Check: buildtrace status --target .");
  log("Rules are installed. The Agent must still save the work from this session and show its record ID.");
}

async function recoverHistory(targetOverride = null) {
  const target = resolve(targetOverride || getOption("--target", process.cwd()));
  const targetStat = await stat(target).catch(() => null);
  if (!targetStat?.isDirectory()) throw new Error(`target directory does not exist: ${target}`);
  await ensurePrivateBuildtraceIgnore(target);
  const codexHome = resolve(getOption("--codex-home", join(homedir(), ".codex")));
  const claudeHome = resolve(getOption("--claude-home", join(homedir(), ".claude")));
  const report = await auditHistory({ target, codexHome, claudeHome, aliases: getOptions("--project-alias") });
  const destination = await writeHistoryAudit(report, target);
  const matched = report.coverage.codexLocalRollouts.matchedThreadCount;
  const matchedRollouts = report.coverage.codexLocalRollouts.matchedRolloutCount;
  const exactMessages = report.totals.exactUserMessages || 0;
  const compacted = report.totals.compactedWindows || 0;
  log(`✓ recovery audit: ${matchedRollouts} rollout source${matchedRollouts === 1 ? "" : "s"}, ${matched} unique Codex thread${matched === 1 ? "" : "s"}, ${exactMessages} user message reference${exactMessages === 1 ? "" : "s"}, ${compacted} compacted window${compacted === 1 ? "" : "s"}`);
  log(`✓ Claude Code: ${report.coverage.claudeLocalSessions.matchedSessionCount} matching local session${report.coverage.claudeLocalSessions.matchedSessionCount === 1 ? "" : "s"}`);
  log(`  manifest ${destination}`);
  log("! The Agent must still page matching app tasks and promote relevant evidence into BUILDTRACE.md.");
  return report;
}

async function exportProject() {
  const target = resolve(getOption("--target", process.cwd()));
  const format = getOption("--format", "json");
  if (!["json", "jsonl", "markdown", "bundle", "handoff", "claude-memory", "langchain-md"].includes(format)) throw new Error("unsupported export format");
  const sourcePath = await resolveProjectSource(target);
  const markdown = await readFile(sourcePath, "utf8");
  const trace = parseBuildtrace(markdown);
  let payload;

  if (format === "bundle") {
    const output = getOption("--output", null);
    if (!output || output === "-") throw new Error("bundle requires --output /new/empty/directory");
    const destination = resolve(output);
    // A new directory prevents accidental replacement of an archive or export.
    await mkdir(destination, { recursive: false });
    const manifest = { schemaVersion: 3, generatedAt: new Date().toISOString(), sourceName: basename(sourcePath), sha256: contentHash(markdown), evidenceFilesIncluded: false, note: "Complete source text; linked evidence files are not copied. Private export, not a sanitized publication." };
    await writeFile(join(destination, "BUILDTRACE.md"), markdown, { flag: "wx" });
    await writeFile(join(destination, "records.json"), JSON.stringify(trace, null, 2), { flag: "wx" });
    await writeFile(join(destination, "MANIFEST.json"), JSON.stringify(manifest, null, 2), { flag: "wx" });
    log(`✓ private archive bundle: ${destination}`);
    return;
  }

  if (format === "markdown") payload = markdown;
  else if (["handoff", "claude-memory", "langchain-md"].includes(format)) {
    const limit = Number(getOption("--limit", 5));
    const recordIds = getOptions("--record");
    if (!Number.isInteger(limit) || limit < 1) throw new Error("--limit must be a positive integer");
    if (recordIds.some((id) => !trace.entries.some((entry) => entry.recordId === id))) throw new Error("requested record ID not found in this archive");
    payload = buildContextMarkdown(trace, { mode: format, sourceHash: contentHash(markdown), limit, recordIds });
  } else if (format === "json") {
    payload = `${JSON.stringify({ schemaVersion: 3, source: sourceHistoryLabel(target, sourcePath), ...trace }, null, 2)}\n`;
  } else {
    const { entries, ...project } = trace;
    const rows = [
      { type: "project", schemaVersion: 3, source: sourceHistoryLabel(target, sourcePath), ...project },
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

  if (process.argv.includes("--check")) {
    let stale = 0;
    for (const [sourcePath, destinationPath] of managedProjectFiles) {
      const existing = await readFile(join(target, destinationPath)).catch((error) => { if (error.code === "ENOENT") return null; throw error; });
      if (!existing || !existing.equals(await readFile(join(root, sourcePath)))) {
        stale += 1;
        log(`update available: ${destinationPath}`);
      }
    }
    log(`${stale} managed file(s) differ. This check wrote no files; run sync to back up and update.`);
    return;
  }

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
    await assertSafeProjectWritePath(target, destination);
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

  for (const adapter of projectAdapters) {
    const result = await syncProjectAdapter(target, backupRoot, ...adapter);
    updated += result.updated;
    created += result.created;
    kept += result.kept;
    backedUp += result.backedUp;
  }
  await ensureProjectRules(target);

  log(`BuildTrace synced at ${target}: ${updated} updated, ${created} created, ${kept} current.`);
  if (backedUp) log(`Previous managed files backed up to ${backupRoot}`);
  log("Project facts were not touched: docs/buildtrace/BUILDTRACE.md was kept. Only managed BuildTrace blocks in shared Agent instruction files were updated; other instructions were preserved.");
}

async function ensureProjectRules(target) {
  const destination = join(target, "docs/buildtrace/PROJECT-RULES.md");
  await assertSafeProjectWritePath(target, destination);
  const template = "# 本项目的 BuildTrace 偏好\n\n这里可定义记录粒度、领域与动作分类、阶段、默认阅读重点和不记录的内容。没有自定义时沿用通用规则。\n\n分类的稳定 ID 和显示名称写在 BUILDTRACE.md 的‘分类规则’，供看板读取；这里补充判断范围。\n\n项目偏好不能把推断标成原话、混入其他项目或取消来源与历史回溯。sync 保留本文件；历史中的个别要求不自动成为全项目规则。\n";
  return writeWithoutOverwrite(destination, template);
}

async function syncProjectAdapter(target, backupRoot, sourcePath, destinationPath, sharedInstructionFile) {
  const source = join(root, sourcePath);
  const sourceContent = await readFile(source);
  const destination = join(target, destinationPath);
  await assertSafeProjectWritePath(target, destination);

  if (sharedInstructionFile) {
    const beforeStat = await lstat(destination).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    const before = beforeStat ? await readFile(destination) : null;
    const changed = await upsertProjectAdapterBlock(target, source, destination, backupRoot);
    if (!changed) return { updated: 0, created: 0, kept: 1, backedUp: 0 };
    if (before) {
      return { updated: 1, created: 0, kept: 0, backedUp: 1 };
    }
    return { updated: 0, created: 1, kept: 0, backedUp: 0 };
  }

  const destinationStat = await lstat(destination).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (destinationStat?.isSymbolicLink()) {
    throw new Error(`refusing to replace project adapter symlink: ${relative(target, destination)}`);
  }

  const existing = destinationStat ? await readFile(destination) : null;
  if (existing && Buffer.compare(existing, sourceContent) === 0) {
    log(`↷ current ${relative(target, destination)}`);
    return { updated: 0, created: 0, kept: 1, backedUp: 0 };
  }

  let backedUp = 0;
  if (existing) {
    const backup = join(backupRoot, destinationPath);
    await assertSafeProjectWritePath(target, backup);
    await mkdir(dirname(backup), { recursive: true });
    await copyFile(destination, backup);
    backedUp = 1;
  }
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
  log(`✓ ${existing ? "updated" : "created"} ${relative(target, destination)}`);
  return {
    updated: existing ? 1 : 0,
    created: existing ? 0 : 1,
    kept: 0,
    backedUp,
  };
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
  await assertSafeProjectWritePath(target, destination);
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
  await ensureSkillLink(destination);
  log(`  source ${skillRoot}`);
  log("This compatibility command installs rules only. Use `buildtrace setup` for automatic future-project activation.");
}

async function setupAgents() {
  const userHome = resolve(getOption("--home", homedir()));
  const skillDestinations = [
    join(userHome, ".agents", "skills", "buildtrace"),
    join(userHome, ".claude", "skills", "buildtrace"),
    join(userHome, ".cursor", "skills", "buildtrace"),
    join(userHome, ".copilot", "skills", "buildtrace"),
  ];
  for (const destination of skillDestinations) await ensureSkillLink(destination);
  for (const [relativePath, agentName] of globalInstructionTargets) {
    await upsertManagedBlock(join(userHome, relativePath), globalAutoInstructions(agentName));
  }
  log("");
  log("BuildTrace rules installed for Codex, Cursor, Claude Code, GitHub Copilot, Windsurf, and Gemini CLI.");
  log("Each project receives its own clean Markdown archive on first meaningful work; no project records live in the global Skill.");
  log("Reopen the Agent or start a new session so it can load the rules. Project instruction readers such as WorkBuddy can also use AGENTS.md after initialization; this is not a dedicated WorkBuddy integration.");
  log("Try in a project: Enable BuildTrace here, record why we are doing this work, and show me the saved record and board address.");
  log("Check a project with: buildtrace status --target .");
  log("Update later with: npm install -g git+https://github.com/yimleunggggg/Buildtrace.git && buildtrace setup");
}

function help() {
  log("Discover existing projects without changing them: buildtrace discover --root /projects --root /other/folder --output /new/private-report.json\nPass the report to: buildtrace overview --project-list /private-report.json\n");
  log("Project overview: buildtrace overview --target /project/a --target /project/b [--port 4174]\nCustom sources: buildtrace overview --project-list /private/projects.json (array of {target, source?})\nRead-only upgrade check: buildtrace sync --target /project --check\nExports: buildtrace export --target /project [--source /private/BUILDTRACE.md] --format json|jsonl|markdown|bundle|handoff|claude-memory|langchain-md [--output /new/path]\n");
  log("Old project locations: buildtrace recover --target /current/project --project-alias /old/project (repeat --project-alias for multiple locations)\n");
  log("Inspect saved records: buildtrace status [--target /path/to/project] [--source /path/to/BUILDTRACE.md] [--json]\n");
  log(`BuildTrace ${process.env.npm_package_version || "v1.18"}\n\nCommands:\n  buildtrace setup [--home /path/to/test-home]\n  buildtrace doctor [--target /path/to/project]\n  buildtrace audit-quotes [--target /path/to/project] [--source /path/to/BUILDTRACE.md]\n  buildtrace snapshot [--target /path/to/project] [--source /path/to/BUILDTRACE.md] [--reason note]\n  buildtrace history [--target /path/to/project]\n  buildtrace verify-history [--target /path/to/project] [--source /path/to/BUILDTRACE.md]\n  buildtrace restore --target /path/to/project --snapshot <hash-prefix> --confirm\n  buildtrace serve [--target /path/to/project] [--source /path/to/BUILDTRACE.md] [--port 4173]\n  buildtrace init --target /path/to/project\n  buildtrace recover [--target /path/to/project] [--codex-home /path/to/.codex] [--claude-home /path/to/.claude]\n  buildtrace export [--target /path/to/project] [--format json|jsonl] [--output /path]\n  buildtrace playbook [--target /project/a --target /project/b] [--format md|json] [--output /path]\n  buildtrace publish --profile team|public [--target /path/to/project] --output /empty/directory\n  buildtrace sync --target /path/to/project\n  buildtrace deploy-kit --provider github-pages [--target /path/to/project]\n  buildtrace install-codex-skill [--dest /path/to/skill]`);
}

const command = process.argv[2] || "help";

try {
  if (command === "setup") await setupAgents();
  else if (command === "status") await showProjectStatus();
  else if (command === "doctor") await doctor(resolve(getOption("--target", root)));
  else if (command === "audit-quotes") await auditProjectQuotes();
  else if (command === "snapshot") await snapshotProject();
  else if (command === "history") await showProjectHistory();
  else if (command === "verify-history") await verifyProjectHistory();
  else if (command === "restore") await restoreProjectSnapshot();
  else if (command === "serve") await serve();
  else if (command === "overview") {
    const list = getOption("--project-list", null);
    const targets = getOptions("--target");
    if (list && targets.length) throw new Error("use --project-list or --target, not both");
    if (getOption("--source", null) && targets.length !== 1) throw new Error("multiple source overrides require --project-list");
    const selection = list ? JSON.parse(await readFile(resolve(list), "utf8")) : targets.map((target) => ({target, source:getOption("--source", null)}));
    const projects = Array.isArray(selection) ? selection : selection.projects;
    if (!Array.isArray(projects) || projects.some((p) => !p || typeof p.target !== "string" || (p.source && typeof p.source !== "string"))) throw new Error("project list must be an array of {target, source?}");
    await serveOverview({projects, coverage:selection.coverage || null, port:Number(getOption("--port", 4174)), cli:fileURLToPath(import.meta.url)});
  }
  else if (command === "discover") {
    const roots = getOptions("--root");
    const knownPath = getOption("--known-projects", null);
    const overridesPath = getOption("--source-overrides", null);
    const knownProjects = knownPath ? JSON.parse(await readFile(resolve(knownPath), "utf8")) : [];
    const sourceOverrides = overridesPath ? JSON.parse(await readFile(resolve(overridesPath), "utf8")) : {};
    if (!roots.length && !knownProjects.length) throw new Error("discover requires explicit --root or --known-projects");
    if (!Array.isArray(knownProjects) || knownProjects.some(p=>typeof p?.target!=="string")) throw new Error("known projects must be an array of {target, label?}");
    if (!sourceOverrides || Array.isArray(sourceOverrides) || typeof sourceOverrides!=="object" || Object.values(sourceOverrides).some(p=>typeof p!=="string")) throw new Error("source overrides must map project paths to archive paths");
    const report = await discoverProjects({roots,knownProjects,sourceOverrides});
    const output = getOption("--output", null);
    if (output) { await writeWithoutOverwrite(resolve(output), JSON.stringify(report,null,2)+"\n"); log(`Found ${report.projects.length} locations; scan scope and gaps are in the report.`); }
    else process.stdout.write(JSON.stringify(report,null,2)+"\n");
  }
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
