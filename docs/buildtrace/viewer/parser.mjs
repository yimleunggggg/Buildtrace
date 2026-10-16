const FIELD_MAP = {
  "记录 ID": "recordId",
  "来源可信度": "sourceTrust",
  "来源覆盖": "sourceCoverage",
  "关联任务": "relatedTask",
  "依据": "evidence",
  "场景": "scene",
  "领域": "area",
  "动作": "action",
  "关键节点": "milestone",
  "可见范围": "visibility",
  "结果状态": "status",
  "后续回看": "reviewDate",
};

const SECTION_MAP = {
  "沟通原文": "quote",
  "需求总结": "summary",
  "动机要点": "whyHighlights",
  "行动要点": "actionHighlights",
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

export const DEFAULT_TAXONOMY = {
  areas: [
    ["interface", "界面与交互", "Interface & UX", "页面布局、视觉、文案和用户操作；管理后台页面也按界面归类。"],
    ["product", "产品逻辑", "Product logic", "用户流程、功能边界、业务规则和产品取舍。"],
    ["backend", "服务与接口", "Backend & APIs", "接口、权限、后台任务和服务端行为，不是管理后台的页面外观。"],
    ["data", "数据与内容", "Data & content", "数据结构、质量、导入、分析及内容资料。"],
    ["growth", "运营与增长", "Growth & operations", "搜索、传播、活动、转化和商业化。"],
    ["delivery", "发布与运行", "Delivery & runtime", "部署、版本发布、运行故障和监控。"],
    ["workflow", "开发与 AI 协作", "Development & AI", "Agent、工具规则、开发流程和跨工具交接。"],
    ["system", "系统架构", "System architecture", "跨模块边界、存储方案和系统级技术结构。"],
  ].map(([id, label, en, rule]) => ({ id, label, en, rule })),
  actions: [
    ["add", "新增", "Add"], ["improve", "优化", "Improve"], ["fix", "修复", "Fix"],
    ["decide", "决策", "Decide"], ["research", "调研", "Research"], ["analyze", "分析", "Analyze"],
    ["restructure", "重构", "Restructure"], ["publish", "发布", "Publish"], ["review", "复盘", "Review"],
  ].map(([id, label, en]) => ({ id, label, en, rule: "" })),
};

function parseTaxonomy(markdown) {
  const block = markdown.match(/^## 分类规则\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1];
  const parsed = { areas: [], actions: [] };
  for (const line of (block || "").split("\n")) {
    const match = line.match(/^\s*- \[(area|action)\s*\|\s*([a-z0-9-]+)\s*\|\s*([^|\]]+)(?:\|\s*([^\]]+))?]\s*(.*)$/);
    if (!match) continue;
    const [, kind, id, label, en, rule] = match;
    const list = parsed[kind === "area" ? "areas" : "actions"];
    if (!list.some((item) => item.id === id)) list.push({ id, label: label.trim(), en: en?.trim() || label.trim(), rule });
  }
  return {
    areas: parsed.areas.length ? parsed.areas : DEFAULT_TAXONOMY.areas,
    actions: parsed.actions.length ? parsed.actions : DEFAULT_TAXONOMY.actions,
    customized: Boolean(block),
  };
}

const LEGACY_AREAS = { "ux-content": "interface", decision: "product", architecture: "system", "analytics-data": "data", "seo-growth": "growth", monetization: "growth", "ops-release": "delivery", "ai-workflow": "workflow" };
const LEGACY_ACTIONS = { feature: "add", bugfix: "fix", "ux-content": "improve", decision: "decide", architecture: "restructure", "analytics-data": "analyze", "seo-growth": "improve", monetization: "decide", "ops-release": "publish", "ai-workflow": "improve" };

function splitTags(value) {
  return [...new Set(String(value || "").split(/\s*[,，、/]\s*/).filter(Boolean))];
}

// Conservative display triage only. Never delete or rewrite the archived message.
export function quoteRelevance(text, purpose = "") {
  if (["decision", "approval", "evidence", "constraint"].includes(purpose)) return "substantive";
  if (purpose === "coordination") return "coordination";
  const plain = String(text || "").trim().replace(/[\s，。！？?!、；;～~]+$/g, "");
  return /^(?:怎么了|怎么样了|如何了|好了没|好了吗|进度呢|继续|继续吧|继续做吧|好的|好|嗯|收到|谢谢|ok|okay|thanks|continue|any updates)$/i.test(plain) ? "coordination" : "substantive";
}

export function quoteKind(quote) {
  if (["compacted-summary", "artifact-evidence", "inferred"].includes(quote.fidelity)) return "summary";
  if (quote.fidelity === "verbatim" && quote.speaker === "user") return "original";
  if (quote.fidelity === "unknown" && /^(?:用户(?:要求|指出|说|希望)|来自旧记录摘要|历史.*摘要)/.test(quote.text || "")) return "summary";
  return "unverified";
}

export function buildRecordHandoff(project, entry, action, context = {}, locale = "zh") {
  const identity = [
    `Project: ${project.title}`,
    `Record ID: ${entry.recordId || entry.id}`,
    `Date: ${entry.date}`,
    `Title: ${entry.title}`,
    context.projectRoot ? `Project root: ${context.projectRoot}` : "",
    context.sourcePath ? `Archive: ${context.sourcePath}` : "Archive: locate this project's BuildTrace source; respect source overrides",
    context.branch ? `Viewed branch: ${context.branch}` : "",
    context.repositoryUrl ? `Repository: ${context.repositoryUrl}` : "",
  ].filter(Boolean).join("\n");
  if (locale === "en") return `Please ${action === "review" ? "append the later outcome" : action === "evidence" ? "add evidence" : "append a correction"} for this specific record.\n\n${identity}\n\nFirst verify the project, archive and record ID. Do not write into an unrelated current project. If another worktree has a different version, list candidates and ask which to update; never silently merge them. Take a snapshot, append a dated update using my next evidence, preserve old words and reasoning, verify history and report the saved file and record ID. Missing evidence stays missing; correlation is not causation.\n\nMy new evidence or correction: `;
  return `请为下面指定记录${action === "review" ? "补记后来结果" : action === "evidence" ? "补充依据" : "追加纠错"}。这不是给任意当前项目新增一条记录。\n\n${identity}\n\n先核对项目、实际档案路径和记录 ID；不要写进无关项目。若不同工作树有不同版本，先列出候选让我确认，不能静默合并。保存快照后，根据我接下来的证据追加日期、事实和判断，保留已有原话与当时的认识；校验历史并给出保存文件和记录 ID。缺失信息注明缺失，不把相关性说成确定因果。\n\n我补充的数据、反馈或纠错：`;
}

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

    const [id = `Q${index + 1}`, speaker = "unknown", sourceRef = "", fidelity = "unknown", ...qualifiers] = metadata[1]
      .split("|")
      .map((part) => part.trim());
    return {
      id,
      speaker,
      sourceRef,
      fidelity,
      purpose: qualifiers.find((item) => /^(?:purpose|用途)=/.test(item))?.split("=").slice(1).join("=") || "",
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
  "确认": "confirmation",
  confirmation: "confirmation",
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
  const match = markdown.match(/## (?:作者的话(?:（可选）)?|为什么做（人写的）)\s*\n([\s\S]*?)(?=\n## |$)/);
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
    area: "",
    action: "",
    scenes: ["decision"],
    milestone: false,
    visibility: "private",
    status: "不确定",
    reviewDate: "无",
    sections: {
      quote: "",
      summary: "",
      whyHighlights: "",
      actionHighlights: "",
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
  entry.milestone = ["是", "true", "yes", "major"].includes(String(entry.milestone).toLowerCase());
  entry.visibility = normalizeVisibility(entry.visibility);
  entry.scenes = [...new Set(String(entry.scene).split(/\s*(?:\/|,|，|、)\s*/).map((scene) => scene.trim()).filter(Boolean))];
  if (!entry.scenes.length) entry.scenes = ["decision"];
  entry.scene = entry.scenes[0];
  entry.areas = splitTags(entry.area);
  entry.actions = splitTags(entry.action);
  entry.classificationSource = entry.areas.length || entry.actions.length ? "explicit" : "legacy";
  if (!entry.areas.length) entry.areas = [...new Set(entry.scenes.map((scene) => LEGACY_AREAS[scene]).filter(Boolean))];
  if (!entry.areas.length) entry.areas = ["unclassified"];
  if (!entry.actions.length) entry.actions = [...new Set(entry.scenes.map((scene) => LEGACY_ACTIONS[scene]).filter(Boolean))];
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
    sourceTrust: entry.sourceTrust,
    evidence: entry.evidence,
  })));

  return {
    title,
    taxonomy: parseTaxonomy(normalized),
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
