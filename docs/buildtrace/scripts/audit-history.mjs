import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { lstat, mkdir, readFile, readdir, realpath, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join, relative, resolve, sep } from "node:path";
import { createInterface } from "node:readline";

const EVIDENCE_EXTENSIONS = new Set([
  ".csv",
  ".jpeg",
  ".jpg",
  ".json",
  ".jsonl",
  ".md",
  ".pdf",
  ".png",
  ".txt",
  ".webp",
]);

const SKIPPED_DIRECTORIES = new Set([".buildtrace", ".git", "dist", "node_modules"]);

async function canonicalPath(pathname) {
  return realpath(pathname).catch(() => resolve(pathname));
}

function isInside(candidate, parent) {
  return candidate === parent || candidate.startsWith(`${parent}${sep}`);
}

function normalizeRepositoryUrl(value = "") {
  return value
    .trim()
    .replace(/^git@([^:]+):/, "$1/")
    .replace(/^https?:\/\//, "")
    .replace(/^ssh:\/\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

async function walkFiles(root, predicate, skipped = new Set()) {
  const files = [];
  const rootStat = await stat(root).catch(() => null);
  if (!rootStat?.isDirectory()) return files;

  const queue = [root];
  while (queue.length) {
    const directory = queue.shift();
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const pathname = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!skipped.has(entry.name)) queue.push(pathname);
      } else if (entry.isFile() && predicate(pathname)) {
        files.push(pathname);
      }
    }
  }
  return files;
}

function gitOutput(target, args) {
  const result = spawnSync("git", ["-C", target, ...args], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  return result.status === 0 ? result.stdout.trim() : "";
}

function getTargetGit(target) {
  const repositoryUrl = gitOutput(target, ["remote", "get-url", "origin"]);
  const commitLines = gitOutput(target, ["log", "--all", "--reverse", "--format=%H%x09%cI"])
    .split("\n")
    .filter(Boolean);
  const branches = gitOutput(target, ["for-each-ref", "--format=%(refname:short)", "refs/heads", "refs/remotes"])
    .split("\n")
    .filter(Boolean);

  return {
    status: commitLines.length ? "audited" : "not-found",
    repositoryUrl,
    normalizedRepositoryUrl: normalizeRepositoryUrl(repositoryUrl),
    commitCount: commitLines.length,
    firstCommit: commitLines[0] || null,
    latestCommit: commitLines.at(-1) || null,
    branches,
  };
}

function extractParentThread(source) {
  return source?.subagent?.thread_spawn?.parent_thread_id || null;
}

async function sha256(pathname) {
  const hash = createHash("sha256");
  await new Promise((resolveHash, rejectHash) => {
    const stream = createReadStream(pathname);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.once("end", resolveHash);
    stream.once("error", rejectHash);
  });
  return hash.digest("hex");
}

async function inspectRollout(pathname, target, targetRepositoryUrl, codexHome) {
  const counters = {
    compactedWindows: 0,
    exactUserMessages: 0,
    agentMessages: 0,
    reasoningItems: 0,
    toolCalls: 0,
    toolOutputs: 0,
  };
  const messageRefs = [];
  const sessionIds = new Set();
  const workingDirectories = new Set();
  const repositoryUrls = new Set();
  let firstTimestamp = null;
  let lastTimestamp = null;
  let source = null;
  let threadSource = null;
  let parentThreadId = null;
  let agentPath = null;
  let agentNickname = null;

  const input = createInterface({ input: createReadStream(pathname), crlfDelay: Infinity });
  for await (const line of input) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }

    if (event.timestamp) {
      firstTimestamp ||= event.timestamp;
      lastTimestamp = event.timestamp;
    }

    if (event.type === "session_meta") {
      const payload = event.payload || {};
      if (payload.id || payload.session_id) sessionIds.add(payload.id || payload.session_id);
      if (payload.cwd) workingDirectories.add(await canonicalPath(payload.cwd));
      if (payload.git?.repository_url) repositoryUrls.add(normalizeRepositoryUrl(payload.git.repository_url));
      source ||= payload.source || null;
      threadSource ||= payload.thread_source || null;
      parentThreadId ||= extractParentThread(payload.source);
      agentPath ||= payload.source?.subagent?.thread_spawn?.agent_path || null;
      agentNickname ||= payload.source?.subagent?.thread_spawn?.agent_nickname || null;
      continue;
    }

    if (event.type === "compacted") counters.compactedWindows += 1;
    if (event.type !== "response_item") continue;

    const payload = event.payload || {};
    if (payload.type === "message") {
      if (payload.role === "user") {
        counters.exactUserMessages += 1;
        if (payload.id) messageRefs.push({ id: payload.id, role: "user" });
      } else if (payload.role === "assistant") {
        counters.agentMessages += 1;
        if (payload.id) messageRefs.push({ id: payload.id, role: "assistant" });
      }
    } else if (payload.type === "reasoning") {
      counters.reasoningItems += 1;
    } else if (["function_call", "custom_tool_call"].includes(payload.type)) {
      counters.toolCalls += 1;
    } else if (["function_call_output", "custom_tool_call_output"].includes(payload.type)) {
      counters.toolOutputs += 1;
    }
  }

  const cwdMatch = [...workingDirectories].some((cwd) => isInside(cwd, target));
  const repositoryMatch = Boolean(
    targetRepositoryUrl && [...repositoryUrls].some((url) => url === targetRepositoryUrl),
  );
  if (!cwdMatch && !repositoryMatch) return null;

  const fileStat = await stat(pathname);
  const threadId = [...sessionIds].at(-1) || basename(pathname).match(/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\.jsonl$/)?.[1] || null;

  return {
    threadId,
    sourcePath: relative(codexHome, pathname),
    sourceSha256: await sha256(pathname),
    sourceBytes: fileStat.size,
    matchedBy: cwdMatch ? "cwd" : "git-origin",
    workingDirectories: [...workingDirectories],
    repositoryUrls: [...repositoryUrls].filter(Boolean),
    firstTimestamp,
    lastTimestamp,
    source,
    threadSource,
    parentThreadId,
    agentPath,
    agentNickname,
    counters,
    messageRefs,
  };
}

function readSpawnEdges(codexHome) {
  const database = join(codexHome, "state_5.sqlite");
  const result = spawnSync(
    "sqlite3",
    ["-readonly", database, "select parent_thread_id || char(9) || child_thread_id || char(9) || status from thread_spawn_edges;"],
    { encoding: "utf8" },
  );
  if (result.status !== 0) return { status: "unavailable", edges: [] };
  const edges = result.stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [parentThreadId, childThreadId, status] = line.split("\t");
      return { parentThreadId, childThreadId, status };
    });
  return { status: "audited", edges };
}

async function inspectProjectEvidence(target) {
  const paths = await walkFiles(
    target,
    (pathname) => EVIDENCE_EXTENSIONS.has(pathname.slice(pathname.lastIndexOf(".")).toLowerCase()),
    SKIPPED_DIRECTORIES,
  );
  const likelyExports = paths.filter((pathname) =>
    /chat|conversation|export|history|memory|transcript|会话|历史|对话|记录/i.test(relative(target, pathname)),
  );
  return {
    status: "audited",
    candidateFileCount: paths.length,
    likelyConversationExports: likelyExports.slice(0, 200).map((pathname) => relative(target, pathname)),
    truncated: likelyExports.length > 200,
  };
}

export async function auditHistory({ target, codexHome = process.env.CODEX_HOME || join(homedir(), ".codex") }) {
  const canonicalTarget = await canonicalPath(target);
  const canonicalCodexHome = await canonicalPath(codexHome);
  const git = getTargetGit(canonicalTarget);
  const rolloutRoots = [
    join(canonicalCodexHome, "sessions"),
    join(canonicalCodexHome, "archived_sessions"),
  ];
  const rolloutFiles = [];
  for (const rolloutRoot of rolloutRoots) {
    rolloutFiles.push(...await walkFiles(rolloutRoot, (pathname) => pathname.endsWith(".jsonl")));
  }

  const threads = [];
  for (const pathname of rolloutFiles) {
    const thread = await inspectRollout(
      pathname,
      canonicalTarget,
      git.normalizedRepositoryUrl,
      canonicalCodexHome,
    );
    if (thread) threads.push(thread);
  }

  const threadIds = new Set(threads.map((thread) => thread.threadId).filter(Boolean));
  const spawnGraph = readSpawnEdges(canonicalCodexHome);
  const relevantEdges = spawnGraph.edges.filter((edge) =>
    threadIds.has(edge.parentThreadId) || threadIds.has(edge.childThreadId),
  );
  for (const edge of relevantEdges) {
    threadIds.add(edge.parentThreadId);
    threadIds.add(edge.childThreadId);
  }

  const projectEvidence = await inspectProjectEvidence(canonicalTarget);
  const totals = threads.reduce((sum, thread) => {
    for (const [key, value] of Object.entries(thread.counters)) sum[key] = (sum[key] || 0) + value;
    return sum;
  }, {});
  const userMessageIds = new Set();
  let unidentifiedUserMessageOccurrences = 0;
  for (const thread of threads) {
    const identified = thread.messageRefs.filter((message) => message.role === "user" && message.id);
    for (const message of identified) userMessageIds.add(message.id);
    unidentifiedUserMessageOccurrences += Math.max(0, thread.counters.exactUserMessages - identified.length);
  }
  totals.exactUserMessageOccurrences = totals.exactUserMessages || 0;
  totals.exactUserMessages = userMessageIds.size + unidentifiedUserMessageOccurrences;

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: {
      path: canonicalTarget,
      repositoryUrl: git.repositoryUrl || null,
    },
    coverage: {
      codexTaskApi: {
        status: "agent-required",
        note: "When list_threads/read_thread tools are available, the Agent must page through matching tasks because the CLI cannot call app-only tools.",
      },
      codexLocalRollouts: {
        status: rolloutFiles.length ? "audited" : "unavailable",
        searchedFileCount: rolloutFiles.length,
        matchedRolloutCount: threads.length,
        matchedThreadCount: new Set(threads.map((thread) => thread.threadId || thread.sourcePath)).size,
        note: "Rollout sources may repeat forked message prefixes. exactUserMessages is deduplicated by message ID; exactUserMessageOccurrences retains the pre-deduplication count.",
      },
      compaction: {
        status: totals.compactedWindows ? "found" : "not-found",
        compactedWindows: totals.compactedWindows || 0,
        note: "A compacted marker or summary does not replace earlier exact messages when the rollout still contains them.",
      },
      multiAgent: {
        status: threads.some((thread) => thread.parentThreadId) || relevantEdges.length ? "found" : "not-found",
        spawnEdges: relevantEdges.length,
      },
      forkLineage: {
        status: "partial",
        note: "Native parent metadata is retained when exposed. Otherwise shared-prefix comparison can only infer lineage and must be labeled inferred.",
      },
      git,
      projectEvidence,
      externalPlatforms: {
        status: "not-audited",
        note: "External chats and platforms require a user-provided export or an authorized connector.",
      },
    },
    totals,
    threads,
    spawnEdges: relevantEdges,
    unresolved: [
      "Codex app tasks have not been paged until an Agent uses list_threads/read_thread.",
      "Forks without exposed parent metadata require shared-prefix comparison and remain inferred.",
      "Deleted, inaccessible, or never-exported conversations cannot be claimed as recovered.",
      "External tools remain unaudited until an export or connector is available.",
    ],
  };
}

export async function writeHistoryAudit(report, target) {
  const privateRoot = join(target, ".buildtrace");
  const recoveryRoot = join(privateRoot, "recovery");
  const destination = join(recoveryRoot, "latest.json");
  const privateRootStat = await lstat(privateRoot).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (privateRootStat?.isSymbolicLink() || (privateRootStat && !privateRootStat.isDirectory())) {
    throw new Error("refusing to use unsafe .buildtrace path");
  }
  if (!privateRootStat) await mkdir(privateRoot, { recursive: true });
  const recoveryStat = await lstat(recoveryRoot).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (recoveryStat?.isSymbolicLink() || (recoveryStat && !recoveryStat.isDirectory())) {
    throw new Error("refusing to use unsafe .buildtrace/recovery path");
  }
  if (!recoveryStat) await mkdir(recoveryRoot, { recursive: true });
  const ignorePath = join(privateRoot, ".gitignore");
  const ignoreStat = await lstat(ignorePath).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (ignoreStat?.isSymbolicLink() || (ignoreStat && !ignoreStat.isFile())) {
    throw new Error("refusing to replace unsafe .buildtrace/.gitignore");
  }
  const existingIgnore = await readFile(ignorePath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  const ignoreLines = existingIgnore.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let ignoreChanged = false;
  for (const required of ["backups/", "recovery/"]) {
    if (!ignoreLines.includes(required)) {
      ignoreLines.push(required);
      ignoreChanged = true;
    }
  }
  if (ignoreChanged || !existingIgnore) {
    await writeFile(ignorePath, `${ignoreLines.join("\n")}\n`, "utf8");
  }
  const destinationStat = await lstat(destination).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (destinationStat?.isSymbolicLink() || (destinationStat && !destinationStat.isFile())) {
    throw new Error("refusing to replace unsafe recovery manifest");
  }
  await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return destination;
}
