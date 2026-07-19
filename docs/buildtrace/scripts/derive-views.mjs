const PROFILE_LEVEL = { private: 0, team: 1, public: 2 };

const SECTION_LABELS = {
  summary: "需求总结",
  agentUnderstanding: "Agent 当时理解",
  agentPlan: "Agent 计划",
  executionTrace: "执行轨迹",
  hypothesis: "人的假设",
  why: "为什么做",
  changes: "做了什么",
  watchPlan: "观察计划",
  dataChanges: "数据变化",
  outcomeJudgment: "结果判断",
  decisionPrinciples: "决策原则",
  technical: "技术备注",
  result: "结果",
};

const TEAM_SECTIONS = [
  "summary",
  "agentUnderstanding",
  "agentPlan",
  "executionTrace",
  "hypothesis",
  "why",
  "changes",
  "watchPlan",
  "dataChanges",
  "outcomeJudgment",
  "decisionPrinciples",
  "technical",
  "result",
];

const PUBLIC_SECTIONS = [
  "summary",
  "hypothesis",
  "why",
  "changes",
  "watchPlan",
  "dataChanges",
  "outcomeJudgment",
  "decisionPrinciples",
  "result",
];

function cleanValue(value) {
  return String(value || "").trim();
}

export function sanitizeSharedText(value, profile = "public") {
  let output = cleanValue(value)
    .replace(/\bfile:\/\/\/\S+/gi, "[internal URL removed]")
    .replace(/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[[^\]]+])(?::\d+)?\S*/gi, "[internal URL removed]")
    .replace(/(?:\/Users|\/home|\/private|\/var\/folders)\/[^\s)`'";，。]+/g, "[absolute path removed]")
    .replace(/\b[A-Za-z]:\\[^\s)`'";，。]+/g, "[absolute path removed]")
    .replace(/\b(?:sk-[A-Za-z0-9_-]{12,}|ghp_[A-Za-z0-9]{12,}|AKIA[A-Z0-9]{12,})\b/g, "[secret removed]")
    .replace(/\b(api[_-]?key|token|password|secret)\s*[:=]\s*[^\s,，;；]+/gi, "$1=[secret removed]");

  if (profile === "public") {
    output = output
      .replace(/`(?:\.\.?\/|docs\/|src\/|bin\/|tests\/|templates\/|adapters\/|\.buildtrace\/)[^`]+`/g, "`[project path removed]`")
      .replace(/\b(?:docs|src|bin|tests|templates|adapters)\/[A-Za-z0-9_.\/-]+/g, "[project path removed]")
      .replace(/\b(?:codex-thread|rollout|item)\/[A-Za-z0-9_.\/-]+/g, "[source reference removed]")
      .replace(/\[([A-Z]+\d+)\s*<-\s*[^\]]+]/g, "[$1]");
  }

  return output;
}

export function findSensitiveFindings(value) {
  const text = String(value || "");
  const checks = [
    ["absolute macOS path", /\/Users\//],
    ["absolute Linux path", /\/home\//],
    ["local file URL", /file:\/\//i],
    ["localhost URL", /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)/i],
    ["common secret token", /\b(?:sk-[A-Za-z0-9_-]{12,}|ghp_[A-Za-z0-9]{12,}|AKIA[A-Z0-9]{12,})\b/],
    ["secret assignment", /\b(?:api[_-]?key|token|password|secret)\s*[:=]\s*(?!\[secret removed])/i],
  ];
  return checks.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function renderListSection(label, items, profile) {
  const values = items.map((item) => sanitizeSharedText(item, profile)).filter(Boolean);
  if (!values.length) return "";
  const body = values.map((item) => {
    const [firstLine, ...rest] = item.split("\n");
    return [`- ${firstLine}`, ...rest.map((line) => `  ${line}`)].join("\n");
  }).join("\n");
  return `${label}:\n${body}\n`;
}

function renderTeamQuotes(entry) {
  if (!entry.quotes?.length) return "";
  const body = entry.quotes.map((quote, index) => {
    const id = cleanValue(quote.id) || `Q${index + 1}`;
    const speaker = cleanValue(quote.speaker) || "unknown";
    const fidelity = cleanValue(quote.fidelity) || "unknown";
    const text = sanitizeSharedText(quote.text, "team");
    return `- [${id} | ${speaker} | team-snapshot | ${fidelity}]\n${text.split("\n").map((line) => `  > ${line}`).join("\n")}`;
  }).join("\n");
  return `沟通原文:\n${body}\n`;
}

function renderRecord(entry, profile) {
  const sections = profile === "public" ? PUBLIC_SECTIONS : TEAM_SECTIONS;
  const evidence = profile === "public"
    ? "脱敏公开快照；完整依据保留在私密主源"
    : sanitizeSharedText(entry.evidence, "team") || "团队快照；完整依据保留在私密主源";
  const lines = [
    `### ${entry.date} — ${sanitizeSharedText(entry.title, profile)}`,
    "",
    `记录 ID: ${cleanValue(entry.recordId || entry.id)}`,
    `来源可信度: ${cleanValue(entry.sourceTrust) || "unknown"}`,
    `来源覆盖: ${profile}-snapshot`,
    "关联任务: 已脱敏",
    `依据: ${evidence}`,
    `场景: ${cleanValue(entry.scene) || "decision"}`,
    `可见范围: ${profile}`,
    `结果状态: ${cleanValue(entry.status) || "不确定"}`,
    `后续回看: ${cleanValue(entry.reviewDate) || "无"}`,
    "",
  ];

  if (profile === "team") lines.push(renderTeamQuotes(entry));
  for (const key of sections) {
    const items = entry.sectionItems?.[key]?.length
      ? entry.sectionItems[key]
      : (entry.sections?.[key] ? [entry.sections[key]] : []);
    lines.push(renderListSection(SECTION_LABELS[key], items, profile));
  }
  return lines.filter((line, index, all) => line !== "" || all[index - 1] !== "").join("\n").trim();
}

function renderTeamPrinciples(principles) {
  const values = principles
    .map((principle) => ({
      label: sanitizeSharedText(principle.label, "team"),
      value: sanitizeSharedText(principle.value, "team"),
    }))
    .filter((principle) => principle.value);
  if (!values.length) return "";
  return `## 项目初心\n\n${values.map((principle) => `- ${principle.label ? `${principle.label}: ` : ""}${principle.value}`).join("\n")}\n`;
}

export function buildPublication(trace, profile, generatedAt = new Date().toISOString()) {
  if (!["team", "public"].includes(profile)) {
    throw new Error("publication profile must be team or public");
  }

  const includedEntries = trace.entries.filter((entry) => PROFILE_LEVEL[entry.visibility] >= PROFILE_LEVEL[profile]);
  const redactions = profile === "public"
    ? ["private/team records", "original words", "source/task references", "Agent internal process", "technical notes", "project resources", "internal paths and local URLs"]
    : ["private records", "source/task references", "project resources", "absolute paths and local URLs"];
  const sections = [
    `# ${sanitizeSharedText(trace.title, profile)}`,
    "",
    "这是从私密 BUILDTRACE.md 生成的只读派生快照，不是项目记忆主源。",
    "",
    "## 发布信息",
    "",
    `- 视图: ${profile}`,
    `- 生成时间: ${generatedAt}`,
    `- 已移除: ${redactions.join("、")}`,
    "",
  ];

  if (profile === "team") sections.push(renderTeamPrinciples(trace.principles));
  sections.push("## 项目记录", "");
  if (includedEntries.length) {
    sections.push(includedEntries.map((entry) => renderRecord(entry, profile)).join("\n\n"));
  } else {
    sections.push("<!-- 当前没有标记为此可见范围的项目记录。 -->");
  }

  const markdown = `${sections.filter((section, index, all) => section !== "" || all[index - 1] !== "").join("\n").trim()}\n`;
  const findings = findSensitiveFindings(markdown);
  if (findings.length) throw new Error(`sanitized ${profile} output still contains: ${findings.join(", ")}`);

  return {
    markdown,
    profile,
    generatedAt,
    sourceRecordCount: trace.entries.length,
    publishedRecordCount: includedEntries.length,
    redactions,
  };
}

export function buildDecisionPlaybook(projects) {
  const groups = new Map();
  for (const project of projects) {
    for (const principle of project.trace.decisionPrinciples || []) {
      const id = cleanValue(principle.id);
      if (!/^dp-[a-z0-9-]+$/.test(id) || !cleanValue(principle.text)) continue;
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push({
        id,
        category: cleanValue(principle.category) || "未分类",
        text: cleanValue(principle.text),
        project: project.name,
        recordId: principle.recordId,
        recordTitle: principle.recordTitle,
        recordDate: principle.recordDate,
      });
    }
  }

  const principles = [...groups.entries()].map(([id, evidence]) => {
    const variants = [...new Map(evidence.map((item) => [`${item.category}\u0000${item.text}`, { category: item.category, text: item.text }])).values()];
    const projectCount = new Set(evidence.map((item) => item.project)).size;
    return {
      id,
      category: variants[0]?.category || "未分类",
      text: variants[0]?.text || "",
      variants,
      evidence,
      projectCount,
      occurrenceCount: evidence.length,
      status: variants.length > 1 ? "conflict" : projectCount >= 2 ? "repeated" : "candidate",
    };
  }).sort((a, b) => {
    const rank = { conflict: 0, repeated: 1, candidate: 2 };
    return rank[a.status] - rank[b.status] || a.id.localeCompare(b.id);
  });

  return {
    schemaVersion: 1,
    projectCount: projects.length,
    principleCount: principles.length,
    repeatedCount: principles.filter((principle) => principle.status === "repeated").length,
    conflictCount: principles.filter((principle) => principle.status === "conflict").length,
    principles,
  };
}

export function renderDecisionPlaybookMarkdown(playbook, generatedAt = new Date().toISOString()) {
  const headings = {
    conflict: "需要人工统一的冲突",
    repeated: "跨项目反复出现",
    candidate: "单项目候选",
  };
  const lines = [
    "# 个人决策手册",
    "",
    "> 这是从各项目 BUILDTRACE.md 派生的索引，不是新的事实主源。修改原则时请回到对应项目记录。",
    "",
    `生成时间: ${generatedAt}`,
    `项目数: ${playbook.projectCount}`,
    `原则数: ${playbook.principleCount}`,
    "",
  ];

  for (const status of ["conflict", "repeated", "candidate"]) {
    const principles = playbook.principles.filter((principle) => principle.status === status);
    if (!principles.length) continue;
    lines.push(`## ${headings[status]}`, "");
    for (const principle of principles) {
      lines.push(`### ${principle.id} · ${principle.category}`, "");
      if (status === "conflict") {
        lines.push("同一原则 ID 出现了不同表述，不能自动合并：", "");
        for (const variant of principle.variants) lines.push(`- [${variant.category}] ${variant.text}`);
      } else {
        lines.push(principle.text);
      }
      lines.push("", `出现于 ${principle.projectCount} 个项目、${principle.occurrenceCount} 条记录：`);
      for (const evidence of principle.evidence) {
        lines.push(`- ${evidence.project} · ${evidence.recordDate} · ${evidence.recordTitle} · ${evidence.recordId}`);
      }
      lines.push("");
    }
  }

  if (!playbook.principles.length) lines.push("尚未记录带稳定 ID 的决策原则。", "");
  return `${lines.join("\n").trim()}\n`;
}
