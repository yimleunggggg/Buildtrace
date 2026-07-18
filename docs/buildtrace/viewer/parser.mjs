const FIELD_MAP = {
  "来源可信度": "sourceTrust",
  "依据": "evidence",
  "场景": "scene",
  "结果状态": "status",
  "后续回看": "reviewDate",
};

const SECTION_MAP = {
  "沟通原文": "quote",
  "需求总结": "summary",
  "为什么做": "why",
  "做了什么": "changes",
  "技术备注": "technical",
  "结果": "result",
};

function cleanLine(line) {
  return line.replace(/^\s*[-*]\s+/, "").trim();
}

function normalizeSection(lines) {
  return lines
    .map(cleanLine)
    .filter(Boolean)
    .join("\n");
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function parsePrinciples(markdown) {
  const match = markdown.match(/## 项目初心\s*\n([\s\S]*?)(?=\n## |\n### |$)/);
  if (!match) return [];

  return match[1]
    .split("\n")
    .map(cleanLine)
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf(":");
      if (separator === -1) return { label: "", value: line };
      return {
        label: line.slice(0, separator).trim(),
        value: line.slice(separator + 1).trim(),
      };
    });
}

function parseEntry(header, body, index) {
  const headerMatch = header.match(/^###\s+(\d{4}-\d{2}-\d{2})\s+[—-]\s+(.+)$/);
  if (!headerMatch) return null;

  const [, date, title] = headerMatch;
  const entry = {
    id: `${date}-${slugify(title) || "record"}-${index + 1}`,
    date,
    title: title.trim(),
    sourceTrust: "unknown",
    evidence: "",
    scene: "decision",
    status: "不确定",
    reviewDate: "无",
    sections: {
      quote: "",
      summary: "",
      why: "",
      changes: "",
      technical: "",
      result: "",
    },
  };

  let activeSection = null;
  const sectionLines = Object.fromEntries(
    Object.values(SECTION_MAP).map((key) => [key, []]),
  );

  for (const rawLine of body.split("\n")) {
    const line = rawLine.trimEnd();
    const sectionMatch = line.match(/^([^:：]+)[:：]\s*$/);
    if (sectionMatch && SECTION_MAP[sectionMatch[1].trim()]) {
      activeSection = SECTION_MAP[sectionMatch[1].trim()];
      continue;
    }

    if (!activeSection) {
      const fieldMatch = line.match(/^([^:：]+)[:：]\s*(.+)$/);
      if (fieldMatch && FIELD_MAP[fieldMatch[1].trim()]) {
        entry[FIELD_MAP[fieldMatch[1].trim()]] = fieldMatch[2].trim();
      }
      continue;
    }

    sectionLines[activeSection].push(line);
  }

  for (const [key, lines] of Object.entries(sectionLines)) {
    entry.sections[key] = normalizeSection(lines);
  }

  return entry;
}

export function parseBuildtrace(markdown) {
  if (typeof markdown !== "string") {
    throw new TypeError("BuildTrace source must be a string");
  }

  const normalized = markdown.replace(/\r\n?/g, "\n");
  const title = normalized.match(/^#\s+(.+)$/m)?.[1]?.trim() || "BuildTrace";
  const entryHeader = /^###\s+\d{4}-\d{2}-\d{2}\s+[—-]\s+.+$/gm;
  const matches = [...normalized.matchAll(entryHeader)];
  const entries = [];
  const idCounts = new Map();

  matches.forEach((match, index) => {
    const start = match.index;
    const end = matches[index + 1]?.index ?? normalized.length;
    const block = normalized.slice(start, end);
    const [header, ...bodyLines] = block.split("\n");
    const entry = parseEntry(header, bodyLines.join("\n"), index);
    if (entry) {
      const occurrence = idCounts.get(entry.id) ?? 0;
      idCounts.set(entry.id, occurrence + 1);
      if (occurrence > 0) entry.id = `${entry.id}-${occurrence + 1}`;
      entries.push(entry);
    }
  });

  return {
    title,
    principles: parsePrinciples(normalized),
    entries,
    sourceLength: normalized.length,
  };
}

export function getBuildtraceStats(entries, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const pending = entries.filter((entry) => entry.status === "待观察");
  const effective = entries.filter((entry) => entry.status === "有效");
  const due = pending.filter((entry) => {
    if (!isValidISODate(entry.reviewDate)) return false;
    const date = new Date(`${entry.reviewDate}T00:00:00`);
    return date <= today;
  });
  const nextReview = pending
    .map((entry) => entry.reviewDate)
    .filter(isValidISODate)
    .sort()[0] ?? null;

  return {
    total: entries.length,
    pending: pending.length,
    effective: effective.length,
    due: due.length,
    nextReview,
  };
}
