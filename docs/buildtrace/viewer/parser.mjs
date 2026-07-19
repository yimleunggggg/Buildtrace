const FIELD_MAP = {
  "记录 ID": "recordId",
  "来源可信度": "sourceTrust",
  "来源覆盖": "sourceCoverage",
  "关联任务": "relatedTask",
  "依据": "evidence",
  "场景": "scene",
  "可见范围": "visibility",
  "结果状态": "status",
  "后续回看": "reviewDate",
};

const SECTION_MAP = {
  "沟通原文": "quote",
  "需求总结": "summary",
  "Agent 当时理解": "agentUnderstanding",
  "Agent 计划": "agentPlan",
  "执行轨迹": "executionTrace",
  "人的假设": "hypothesis",
  "为什么做": "why",
  "做了什么": "changes",
  "观察计划": "watchPlan",
  "数据变化": "dataChanges",
  "结果判断": "outcomeJudgment",
  "决策原则": "decisionPrinciples",
  "技术备注": "technical",
  "结果": "result",
};

function cleanLine(line) {
  return line.replace(/^\s*[-*]\s+/, "").trim();
}

function trimBlankLines(lines) {
  const result = [...lines];
  while (result[0] === "") result.shift();
  while (result.at(-1) === "") result.pop();
  return result;
}

function parseSectionLines(lines) {
  const items = [];
  let activeItem = null;
  let inComment = false;

  const commitItem = () => {
    if (!activeItem) return;
    const normalized = trimBlankLines(activeItem).join("\n").trim();
    if (normalized) items.push(normalized);
    activeItem = null;
  };

  for (const rawLine of lines) {
    if (rawLine.includes("<!--")) inComment = true;
    if (inComment) {
      if (rawLine.includes("-->")) inComment = false;
      continue;
    }
    const bullet = rawLine.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      commitItem();
      activeItem = [bullet[1].trimEnd()];
      continue;
    }

    if (!activeItem) activeItem = [];
    const trimmed = rawLine.trim();
    activeItem.push(trimmed.replace(/^>\s?/, ""));
  }
  commitItem();

  return {
    items,
    text: items.join("\n"),
  };
}

function parseQuoteItems(items) {
  return items.map((item, index) => {
    const [firstLine, ...bodyLines] = item.split("\n");
    const metadata = firstLine.match(/^\[([^\]]+)]\s*$/);
    if (!metadata) {
      return {
        id: `Q${index + 1}`,
        speaker: "unknown",
        sourceRef: "",
        fidelity: "unknown",
        text: item,
      };
    }

    const [id = `Q${index + 1}`, speaker = "unknown", sourceRef = "", fidelity = "unknown"] = metadata[1]
      .split("|")
      .map((part) => part.trim());
    return {
      id,
      speaker,
      sourceRef,
      fidelity,
      text: trimBlankLines(bodyLines).join("\n").trim(),
    };
  });
}

const STRUCTURED_FIELD_MAP = {
  "指标": "metric",
  metric: "metric",
  "数据源": "source",
  source: "source",
  "基线": "baseline",
  baseline: "baseline",
  "目标": "target",
  target: "target",
  "窗口": "window",
  window: "window",
  "达成规则": "rule",
  rule: "rule",
  "日期": "date",
  date: "date",
  "值": "value",
  value: "value",
  "变化": "change",
  change: "change",
  "判断": "judgment",
  judgment: "judgment",
  "分类": "category",
  category: "category",
};

function parseStructuredItem(item, index, prefix) {
  const [firstLine, ...bodyLines] = item.split("\n");
  const metadata = firstLine.match(/^\[([^\]]+)]\s*(.*)$/);
  const fallbackId = `${prefix}${index + 1}`;
  if (!metadata) return { id: fallbackId, tag: "", text: item.trim() };

  const parts = metadata[1].split("|").map((part) => part.trim()).filter(Boolean);
  const id = parts.shift() || fallbackId;
  const attributes = {};
  let tag = "";
  for (const part of parts) {
    const separator = part.search(/[=：:]/);
    if (separator === -1) {
      if (!tag) tag = part;
      continue;
    }
    const label = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    const key = STRUCTURED_FIELD_MAP[label] || label;
    attributes[key] = value;
  }

  return {
    id,
    tag,
    text: trimBlankLines([metadata[2], ...bodyLines]).join("\n").trim(),
    ...attributes,
  };
}

function parseStructuredItems(items, prefix) {
  return items.map((item, index) => parseStructuredItem(item, index, prefix));
}

function normalizeVisibility(value) {
  const aliases = {
    private: "private",
    team: "team",
    public: "public",
    "私密": "private",
    "团队": "team",
    "公开": "public",
  };
  return aliases[String(value || "").trim().toLowerCase()] || "private";
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

function parseHumanPurpose(markdown) {
  const match = markdown.match(/## 为什么做（人写的）\s*\n([\s\S]*?)(?=\n## |$)/);
  if (!match) return "";
  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("<!--"))
    .map(cleanLine)
    .join("\n");
}

function parsePublication(markdown) {
  const match = markdown.match(/## 发布信息\s*\n([\s\S]*?)(?=\n## |$)/);
  if (!match) return { profile: "private", generatedAt: "", redactions: [] };
  const fields = {};
  for (const rawLine of match[1].split("\n")) {
    const line = cleanLine(rawLine);
    const separator = line.search(/[:：]/);
    if (separator === -1) continue;
    fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  const profile = normalizeVisibility(fields["视图"] || fields.profile);
  return {
    profile,
    generatedAt: fields["生成时间"] || fields.generatedAt || "",
    redactions: String(fields["已移除"] || fields.redactions || "")
      .split(/[、,，]/)
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function inferResourceCategory(label, value) {
  const text = `${label} ${value}`.toLowerCase();
  if (/github|gitlab|代码|仓库/.test(text)) return "code";
  if (/figma|design|设计|原型/.test(text)) return "design";
  if (/viewer|production|官网|线上|看板|preview|预览/.test(text)) return "view";
  if (/agent|skill|规则/.test(text)) return "agent";
  if (/change|版本|release/.test(text)) return "release";
  if (/ga4|analytics|posthog|search console|webmaster|数据|分析/.test(text)) return "data";
  if (/vercel|cloudflare|pages|deploy|部署|发布/.test(text)) return "deploy";
  if (/stripe|revenue|支付|收入|交易/.test(text)) return "finance";
  if (/admin|console|后台|管理/.test(text)) return "admin";
  if (/community|discord|slack|社群|社区/.test(text)) return "community";
  if (/reference|参考|竞品|灵感/.test(text)) return "reference";
  return "docs";
}

const RESOURCE_CATEGORIES = new Set([
  "code",
  "docs",
  "reference",
  "data",
  "deploy",
  "finance",
  "admin",
  "design",
  "community",
  "view",
  "agent",
  "release",
  "other",
]);

function parseResources(markdown) {
  const match = markdown.match(/## 项目入口\s*\/\s*参考资料\s*\n([\s\S]*?)(?=\n## |$)/);
  if (!match) return [];

  return match[1]
    .split("\n")
    .map(cleanLine)
    .filter(Boolean)
    .map((line, index) => {
      const categoryMatch = line.match(/^\[([a-z-]+)]\s*(.+)$/i);
      const explicitCategory = categoryMatch?.[1].toLowerCase();
      const resourceLine = categoryMatch?.[2] || line;
      const separator = resourceLine.search(/[:：]/);
      const label = separator === -1 ? resourceLine : resourceLine.slice(0, separator).trim();
      const rawValue = separator === -1 ? "" : resourceLine.slice(separator + 1).trim();
      const markdownLink = rawValue.match(/^\[([^\]]+)]\(([^)]+)\)(?:\s*[—-]\s*(.*))?$/);
      const valueParts = rawValue.match(/^(\S+)(?:\s*[—-]\s*(.*))?$/);
      const title = markdownLink?.[1] || label;
      const url = (markdownLink?.[2] || valueParts?.[1] || "").replace(/^`|`$/g, "");
      const note = markdownLink?.[3] || valueParts?.[2] || "";

      return {
        id: `resource-${slugify(label) || index + 1}`,
        title,
        label,
        url,
        note,
        category: RESOURCE_CATEGORIES.has(explicitCategory)
          ? explicitCategory
          : inferResourceCategory(label, rawValue),
      };
    })
    .filter((resource) => resource.url);
}

function parseEntry(header, body, index) {
  const headerMatch = header.match(/^###\s+(\d{4}-\d{2}(?:-\d{2}(?:\s+.+?)?)?)\s+[—-]\s+(.+)$/);
  if (!headerMatch) return null;

  const [, date, title] = headerMatch;
  const entry = {
    id: `${date}-${slugify(title) || "record"}-${index + 1}`,
    recordId: "",
    date,
    title: title.trim(),
    sourceTrust: "unknown",
    sourceCoverage: "",
    relatedTask: "",
    evidence: "",
    scene: "decision",
    visibility: "private",
    status: "不确定",
    reviewDate: "无",
    sections: {
      quote: "",
      summary: "",
      agentUnderstanding: "",
      agentPlan: "",
      executionTrace: "",
      hypothesis: "",
      why: "",
      changes: "",
      watchPlan: "",
      dataChanges: "",
      outcomeJudgment: "",
      decisionPrinciples: "",
      technical: "",
      result: "",
    },
    sectionItems: {},
    quotes: [],
    hypotheses: [],
    watchPlans: [],
    dataChanges: [],
    outcomes: [],
    decisionPrinciples: [],
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
    const parsed = parseSectionLines(lines);
    entry.sections[key] = parsed.text;
    entry.sectionItems[key] = parsed.items;
  }

  entry.quotes = parseQuoteItems(entry.sectionItems.quote || []);
  entry.hypotheses = parseStructuredItems(entry.sectionItems.hypothesis || [], "H");
  entry.watchPlans = parseStructuredItems(entry.sectionItems.watchPlan || [], "W");
  entry.dataChanges = parseStructuredItems(entry.sectionItems.dataChanges || [], "D");
  entry.outcomes = parseStructuredItems(entry.sectionItems.outcomeJudgment || [], "O")
    .map((outcome) => ({ ...outcome, judgment: outcome.judgment || outcome.tag || "pending" }));
  entry.decisionPrinciples = parseStructuredItems(entry.sectionItems.decisionPrinciples || [], "dp-")
    .map((principle) => ({ ...principle, category: principle.category || principle.tag || "未分类" }));
  entry.visibility = normalizeVisibility(entry.visibility);
  if (entry.recordId) entry.id = entry.recordId;

  return entry;
}

export function parseBuildtrace(markdown) {
  if (typeof markdown !== "string") {
    throw new TypeError("BuildTrace source must be a string");
  }

  const normalized = markdown.replace(/\r\n?/g, "\n");
  const title = normalized.match(/^#\s+(.+)$/m)?.[1]?.trim() || "BuildTrace";
  const entryHeader = /^###\s+\d{4}-\d{2}(?:-\d{2}(?:\s+.+?)?)?\s+[—-]\s+.+$/gm;
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

  const decisionPrinciples = entries.flatMap((entry) => entry.decisionPrinciples.map((principle) => ({
    ...principle,
    recordId: entry.recordId || entry.id,
    recordTitle: entry.title,
    recordDate: entry.date,
    visibility: entry.visibility,
  })));

  return {
    title,
    publication: parsePublication(normalized),
    humanPurpose: parseHumanPurpose(normalized),
    principles: parsePrinciples(normalized),
    resources: parseResources(normalized),
    decisionPrinciples,
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
