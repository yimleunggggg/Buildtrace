import { getBuildtraceStats, parseBuildtrace } from "./parser.js";

const translations = {
  zh: {
    skipToContent: "跳到主要内容",
    primaryNavigation: "主要导航",
    mobileNavigation: "移动端导航",
    switchLanguage: "切换语言",
    projectSignals: "项目状态概览",
    recordIndex: "项目记录索引",
    statusFilter: "结果状态筛选",
    selectedRecordDetail: "所选记录详情",
    tutorialChapters: "教程章节",
    brandTagline: "项目因果记忆",
    board: "看板",
    tutorial: "教程",
    traceLens: "项目脉络",
    reviewLens: "复盘轨",
    playbookLens: "决策手册",
    traceLensNote: "按时间查看完整项目记录",
    reviewLensNote: "假设 → 动作 → 数据 → 判断",
    playbookLensNote: "沉淀可跨项目复用的判断",
    reviewTrackTitle: "动作后来有没有效果",
    reviewTrackNote: "不把上线当结果。把人的假设、实际动作、后续数据和成立与否放在同一条轨道上。",
    reviewHypothesis: "人的假设",
    reviewAction: "做了什么",
    reviewEvidence: "数据变化 / 观察",
    reviewJudgment: "后来是否成立",
    noStructuredValue: "这一步尚未记录",
    reviewTrackEmpty: "还没有结构化复盘轨",
    reviewTrackEmptyNote: "下次记录一个需要验证的判断，并写清观察指标、数据源和时间窗口。",
    decisionPlaybookTitle: "个人决策手册",
    decisionPlaybookNote: "当前项目贡献的原则。相同稳定 ID 才会跨项目聚合；不同表述会保留为冲突，交给人确认。",
    decisionCandidate: "单项目候选",
    decisionRepeated: "反复出现",
    decisionConflict: "需要人工统一",
    decisionEvidence: "来自真实记录",
    noDecisionPrinciples: "还没有决策原则",
    noDecisionPrinciplesNote: "只有这次记录真实体现、以后值得复用的判断，才需要稳定的 dp-* ID。",
    crossProjectCommand: "生成跨项目手册",
    visibility: "可见范围",
    profilePrivate: "私密主源",
    profileTeam: "团队快照",
    profilePublic: "脱敏公开版",
    profilePrivateNote: "完整内容只在本地项目中读取",
    profileTeamNote: "仅含团队/公开记录；分享时仍需访问控制",
    profilePublicNote: "只含公开记录；原话、内部过程和路径已在生成时移除",
    density: "密度",
    comfortable: "舒展",
    compact: "紧凑",
    loading: "正在读取项目主源…",
    sourceError: "无法读取项目记录",
    sourceHelp: "请确认 BUILDTRACE.md 位于 docs/buildtrace/，并通过本地服务器打开 Viewer。",
    boardEyebrow: "PROJECT TRACE / LIVE SOURCE",
    boardTitle: "记住为什么，\n不只记住做了什么。",
    boardNote: "每条记录都把动机、行动、证据和结果放在一起。看板只读展示 Markdown 主源，不制造第二份事实。",
    openSource: "查看 BUILDTRACE.md",
    totalRecords: "全部记录",
    pendingReview: "待回看",
    effective: "已验证有效",
    nextReview: "下次回看",
    noReview: "暂无",
    search: "搜索标题、动机或证据",
    all: "全部",
    pending: "待观察",
    valid: "有效",
    uncertain: "不确定",
    ineffective: "无效",
    noResults: "没有匹配记录",
    noResultsHint: "换一个关键词，或清除当前筛选。",
    noPublishedRecords: "当前没有可在此范围展示的记录",
    noPublishedRecordsHint: "旧记录默认私密；只有明确标记为团队或公开的记录才会进入对应快照。",
    backToRecords: "返回记录",
    sourceTrust: "来源可信度",
    evidence: "依据",
    scene: "场景",
    resultStatus: "结果状态",
    reviewDate: "后续回看",
    quote: "沟通原文",
    summary: "需求总结",
    why: "为什么做",
    changes: "做了什么",
    technical: "技术备注",
    result: "结果",
    copyCorrection: "复制修正指令",
    copyReview: "复制回看指令",
    copied: "指令已复制，可以粘贴给 Agent。",
    tutorialEyebrow: "5 MINUTE WORKFLOW",
    tutorialTitle: "四步留下\n可信的项目脉络。",
    tutorialNote: "教程不是强制流程。先理解最小闭环，然后直接回到看板工作。",
    progress: "教程进度",
    markComplete: "标记完成",
    completed: "已完成",
    previous: "上一步",
    next: "下一步",
    openBoard: "进入看板",
    copy: "复制",
    workbench: "项目工作台",
    workbenchNote: "先定位状态，再读因果；所有内容来自 Markdown 主源。",
    projectResources: "项目入口",
    resourceVault: "项目资料柜",
    resourceVaultNote: "代码、文档、数据、部署、支付、设计与参考资料集中放在这里。它们是项目上下文，不是一次变更记录。",
    addResource: "添加项目资料",
    manageResources: "整理资料入口",
    resourceBuilderTitle: "把资料交给 Agent 写入主源",
    resourceBuilderNote: "Viewer 保持只读。填写后会复制一条明确指令，由 Agent 把入口加入 BUILDTRACE.md。",
    resourceTitle: "名称",
    resourceURL: "链接或项目内路径",
    resourceCategory: "分类",
    resourceNote: "什么时候看 / 有什么用",
    copyResourceCommand: "复制添加指令",
    readonlyReminder: "不会写入浏览器缓存，也不会从网页修改项目事实。",
    workflows: "自动记录链路",
    sourceCoverage: "依据覆盖",
    timelineOverview: "项目脉络",
    records: "项目记录",
    allScenes: "全部场景",
    restoreContext: "自动恢复上下文",
    restoreContextNote: "开工前读取相关记录",
    recordSession: "自动摘取本轮",
    recordSessionNote: "从自然语言、改动与验证提炼",
    reviewDue: "自动识别结果",
    reviewDueNote: "从后续反馈更新结论",
    fillGaps: "只问关键缺口",
    fillGapsNote: "缺失会影响判断时才追问",
    noResources: "尚未记录项目入口",
    evidenceMissing: "尚未记录依据",
    causalChain: "记录详情",
    originalWords: "当时原话",
    showAllQuotes: "展开全部原话",
    agentUnderstanding: "Agent 当时理解",
    agentPlan: "Agent 计划",
    executionTrace: "执行轨迹",
    technicalNotes: "实现与验证",
    evidenceSource: "依据 / 来源",
    resultReview: "结果回看",
    copyEvidence: "补充依据",
    projectContext: "项目上下文",
    projectContextNote: "入口、工作方式与依据",
    recordKind: "事项类型",
    recordTags: "节点标签",
    relatedRecords: "同类记录",
    relatedRecordsNote: "与当前节点属于同一事项类型",
    automationDetails: "自动记录如何工作",
    heroTitle: "别让你的思考埋在 AI 对话里",
    heroNote: "把每次为什么做、怎么判断、改了什么、结果怎样，按时间整理成可回看的项目脉络。让人的想法、取舍和行动因果，不会随着上下文压缩一起丢掉。",
    humanPurpose: "为什么做（人写的）",
    humanPurposeExpand: "展开完整原话",
    sourceMode: "Markdown 唯一主源 · Viewer 只读",
    downloadSource: "下载 Markdown",
    newRecordDraft: "新节点草稿",
    deploymentTitle: "可部署成线上看板，手机也能看",
    deploymentNote: "BuildTrace 是静态只读看板。可以随项目部署到 Vercel、Cloudflare Pages、GitHub Pages 或国内静态托管；线上仍只读取项目里的 BUILDTRACE.md。",
    deploymentStatus: "静态站优先",
    deploymentGuide: "查看部署步骤",
    deploymentDrawerTitle: "部署自己的只读看板",
    deploymentDrawerNote: "默认先在本地使用；需要共享时，再选择带访问控制或公开托管。",
    privacyFirst: "公开前先检查隐私",
    privacyNote: "BUILDTRACE.md 可能包含人的原话、未验证假设、本地路径和内部入口。公开部署会让这些内容随静态文件一起可见。",
    localPrivate: "本地 · 默认私密",
    localPrivateNote: "不上传项目记忆，适合日常个人使用。",
    copyCommand: "复制命令",
    openDeployDoc: "打开完整部署说明",
    close: "关闭",
    deploymentVercelNote: "适合已有前端项目、需要预览链接和团队协作。",
    deploymentVercelTag: "预览友好",
    deploymentCloudflareNote: "适合纯静态文件、全球访问和轻量项目。",
    deploymentCloudflareTag: "静态友好",
    deploymentGithubNote: "适合跟随代码仓库和版本记录一起发布。",
    deploymentGithubTag: "仓库直连",
    deploymentDomestic: "国内静态托管",
    deploymentDomesticNote: "适合更在意国内访问、域名和备案管理的项目。",
    deploymentDomesticTag: "按地区选择",
  },
  en: {
    skipToContent: "Skip to main content",
    primaryNavigation: "Primary navigation",
    mobileNavigation: "Mobile navigation",
    switchLanguage: "Switch language",
    projectSignals: "Project signals",
    recordIndex: "Project record index",
    statusFilter: "Outcome status filter",
    selectedRecordDetail: "Selected record detail",
    tutorialChapters: "Tutorial chapters",
    brandTagline: "Project causal memory",
    board: "Board",
    tutorial: "Tutorial",
    traceLens: "Project trail",
    reviewLens: "Review track",
    playbookLens: "Decision playbook",
    traceLensNote: "Browse the full project history over time",
    reviewLensNote: "Hypothesis → action → data → judgment",
    playbookLensNote: "Keep decisions that transfer across projects",
    reviewTrackTitle: "Did the action work later?",
    reviewTrackNote: "Shipping is not the outcome. Keep the human hypothesis, action, later data, and judgment in one review track.",
    reviewHypothesis: "Human hypothesis",
    reviewAction: "What changed",
    reviewEvidence: "Data change / observation",
    reviewJudgment: "Did it hold?",
    noStructuredValue: "Not recorded yet",
    reviewTrackEmpty: "No structured review tracks yet",
    reviewTrackEmptyNote: "Next time, record a testable judgment with its metric, source, and observation window.",
    decisionPlaybookTitle: "Personal decision playbook",
    decisionPlaybookNote: "Principles contributed by this project. Only identical stable IDs aggregate across projects; wording conflicts stay visible for human review.",
    decisionCandidate: "Project candidate",
    decisionRepeated: "Repeated",
    decisionConflict: "Needs human review",
    decisionEvidence: "Evidence records",
    noDecisionPrinciples: "No decision principles yet",
    noDecisionPrinciplesNote: "Use a stable dp-* ID only for a judgment this record truly demonstrates and may be useful again.",
    crossProjectCommand: "Generate cross-project playbook",
    visibility: "Visibility",
    profilePrivate: "Private source",
    profileTeam: "Team snapshot",
    profilePublic: "Redacted public view",
    profilePrivateNote: "Full content stays in the local project",
    profileTeamNote: "Team/public records only; sharing still requires access control",
    profilePublicNote: "Public records only; original words, internal process, and paths were removed at generation time",
    density: "Density",
    comfortable: "Roomy",
    compact: "Compact",
    loading: "Reading the project source…",
    sourceError: "Project record could not be loaded",
    sourceHelp: "Confirm BUILDTRACE.md is in docs/buildtrace/ and open the Viewer through the local server.",
    boardEyebrow: "PROJECT TRACE / LIVE SOURCE",
    boardTitle: "Remember why,\nnot only what changed.",
    boardNote: "Each record keeps intent, action, evidence, and outcome together. The board reads the Markdown source without creating a second version of truth.",
    openSource: "Open BUILDTRACE.md",
    totalRecords: "All records",
    pendingReview: "Pending review",
    effective: "Validated",
    nextReview: "Next review",
    noReview: "None",
    search: "Search title, intent, or evidence",
    all: "All",
    pending: "Pending",
    valid: "Effective",
    uncertain: "Uncertain",
    ineffective: "Ineffective",
    noResults: "No matching records",
    noResultsHint: "Try another phrase or clear the current filter.",
    noPublishedRecords: "No records are available in this sharing scope",
    noPublishedRecordsHint: "Legacy records stay private; only explicitly team or public records enter a shared snapshot.",
    backToRecords: "Back to records",
    sourceTrust: "Source trust",
    evidence: "Evidence",
    scene: "Scene",
    resultStatus: "Outcome",
    reviewDate: "Review date",
    quote: "Original words",
    summary: "Need",
    why: "Why",
    changes: "What changed",
    technical: "Technical notes",
    result: "Result",
    copyCorrection: "Copy correction command",
    copyReview: "Copy review command",
    copied: "Command copied. Paste it to your Agent.",
    tutorialEyebrow: "5 MINUTE WORKFLOW",
    tutorialTitle: "Leave a trustworthy\nproject trail in four steps.",
    tutorialNote: "The tutorial is not a gate. Learn the smallest loop, then return to the board and work.",
    progress: "Tutorial progress",
    markComplete: "Mark complete",
    completed: "Completed",
    previous: "Previous",
    next: "Next",
    openBoard: "Open board",
    copy: "Copy",
    workbench: "Project workbench",
    workbenchNote: "Locate status first, then read causality. Everything comes from the Markdown source.",
    projectResources: "Project resources",
    resourceVault: "Project resource cabinet",
    resourceVaultNote: "Keep code, docs, analytics, deployment, payments, design, and references together. They are project context, not individual change records.",
    addResource: "Add project resource",
    manageResources: "Organize resources",
    resourceBuilderTitle: "Ask the Agent to update the source",
    resourceBuilderNote: "The Viewer stays read-only. This form copies a precise instruction for your Agent to add the resource to BUILDTRACE.md.",
    resourceTitle: "Name",
    resourceURL: "URL or project-relative path",
    resourceCategory: "Category",
    resourceNote: "When to use it / why it matters",
    copyResourceCommand: "Copy add instruction",
    readonlyReminder: "Nothing is written to browser storage or back into project facts from this page.",
    workflows: "Automatic capture",
    sourceCoverage: "Evidence coverage",
    timelineOverview: "Project trail",
    records: "Project records",
    allScenes: "All scenes",
    restoreContext: "Restore automatically",
    restoreContextNote: "Read relevant records before work",
    recordSession: "Capture automatically",
    recordSessionNote: "Infer from language, changes, and checks",
    reviewDue: "Recognize outcomes",
    reviewDueNote: "Update conclusions from later feedback",
    fillGaps: "Ask only for critical gaps",
    fillGapsNote: "Ask when missing context changes judgment",
    noResources: "No project resources recorded",
    evidenceMissing: "No evidence recorded",
    causalChain: "Record detail",
    originalWords: "Original words",
    showAllQuotes: "Expand every original message",
    agentUnderstanding: "Agent understanding at the time",
    agentPlan: "Agent plan",
    executionTrace: "Execution trace",
    technicalNotes: "Implementation and verification",
    evidenceSource: "Evidence / source",
    resultReview: "Outcome review",
    copyEvidence: "Add evidence",
    projectContext: "Project context",
    projectContextNote: "Resources, workflows, and evidence",
    recordKind: "Work type",
    recordTags: "Record tags",
    relatedRecords: "Related records",
    relatedRecordsNote: "Records with the same work type",
    automationDetails: "How automatic capture works",
    heroTitle: "Don't let your thinking get buried in AI chats",
    heroNote: "Turn why you acted, how you judged, what changed, and what happened into a project trail you can revisit. Keep human ideas, tradeoffs, and cause-and-effect from disappearing when context gets compressed.",
    humanPurpose: "Why this exists — written by a human",
    humanPurposeExpand: "Read the full original",
    sourceMode: "Markdown source of truth · Read-only Viewer",
    downloadSource: "Download Markdown",
    newRecordDraft: "New record draft",
    deploymentTitle: "Deploy your own board and view it on mobile",
    deploymentNote: "BuildTrace is a static, read-only board. Deploy it with the project to Vercel, Cloudflare Pages, GitHub Pages, or a regional static host; the online board still reads only the project's BUILDTRACE.md.",
    deploymentStatus: "Static-first",
    deploymentGuide: "View deployment steps",
    deploymentDrawerTitle: "Deploy your own read-only board",
    deploymentDrawerNote: "Use it locally by default. Choose access-controlled or public hosting only when you need to share it.",
    privacyFirst: "Check privacy before publishing",
    privacyNote: "BUILDTRACE.md may contain original words, unverified hypotheses, local paths, and internal links. A public static deployment makes that content visible too.",
    localPrivate: "Local · private by default",
    localPrivateNote: "Keeps project memory on your machine for everyday personal use.",
    copyCommand: "Copy command",
    openDeployDoc: "Open full deployment guide",
    close: "Close",
    deploymentVercelNote: "Good for existing frontend projects, preview links, and team collaboration.",
    deploymentVercelTag: "Preview friendly",
    deploymentCloudflareNote: "Good for static files, global access, and lightweight projects.",
    deploymentCloudflareTag: "Static friendly",
    deploymentGithubNote: "Good for publishing alongside the repository and its version history.",
    deploymentGithubTag: "Repository native",
    deploymentDomestic: "Regional static hosting",
    deploymentDomesticNote: "Good when regional access, domains, and compliance matter more.",
    deploymentDomesticTag: "Choose by region",
  },
};

const tutorialSteps = [
  {
    zh: {
      title: "确认唯一主源",
      subtitle: "先建立可信边界",
      lead: "BuildTrace 的第一条规则很简单：项目事实只写进 BUILDTRACE.md。看板、搜索和筛选都从这里读取。",
      points: [
        "确认 docs/buildtrace/BUILDTRACE.md 存在。",
        "不要让 Viewer、JSON 或浏览器缓存成为第二份事实。",
        "找不到依据时写 unknown，不补一个看似完整的故事。",
      ],
      command: "npm run doctor",
    },
    en: {
      title: "Confirm the single source",
      subtitle: "Set the trust boundary first",
      lead: "BuildTrace starts with one rule: project facts live in BUILDTRACE.md. The board, search, and filters only read from that file.",
      points: [
        "Confirm docs/buildtrace/BUILDTRACE.md exists.",
        "Do not let the Viewer, JSON, or browser storage become a second source of truth.",
        "When evidence is missing, record unknown instead of completing the story.",
      ],
      command: "npm run doctor",
    },
  },
  {
    zh: {
      title: "开始前恢复上下文",
      subtitle: "读初心、最近记录和到期回看",
      lead: "项目规则激活后，新一轮有意义的工作开始前，Agent 会自动恢复与当前任务有关的上下文，不需要用户先说固定口令。重点不是读完历史，而是找回现在的判断依据。",
      points: [
        "照常描述你想做什么，Agent 自动判断需要读取哪些记录。",
        "读取项目初心，避免功能偏离产品边界。",
        "读取最近记录和到期待观察项，找到当前连续性。",
      ],
    },
    en: {
      title: "Restore context before work",
      subtitle: "Read intent, recent records, and due reviews",
      lead: "Once the project rules are active, the Agent automatically restores context relevant to meaningful work. The user does not need a fixed command. The goal is not to reread history; it is to recover the reasoning behind the next move.",
      points: [
        "Describe the work normally; the Agent decides which records are relevant.",
        "Read the project intent so new features stay inside the product boundary.",
        "Read recent records and due outcomes to recover continuity.",
      ],
    },
  },
  {
    zh: {
      title: "完成后记录因果",
      subtitle: "只记录有意义的变化",
      lead: "一次功能、修复、设计或重要决策完成后，Agent 会自动从本轮自然语言、真实改动和验证中摘取因果，不需要用户再说“记录本轮”。",
      points: [
        "保留用户原话，同时单独写 Agent 的需求总结。",
        "写清为什么做、实际做了什么、依据在哪里。",
        "无法当场判断效果时，设为待观察并约定回看日期。",
      ],
    },
    en: {
      title: "Record causality after work",
      subtitle: "Capture only meaningful change",
      lead: "After a feature, fix, design change, or important decision, the Agent automatically extracts causality from ordinary language, real changes, and verification. The user does not need to say ‘Record this session.’",
      points: [
        "Keep the user's original words and write the Agent summary separately.",
        "State why it happened, what actually changed, and where the evidence lives.",
        "If impact is not yet knowable, mark it pending and set a review date.",
      ],
    },
  },
  {
    zh: {
      title: "回看结果并修正",
      subtitle: "让记录随着证据变准",
      lead: "项目记忆不是一次性归档。用户照常描述后来发生的结果，Agent 识别它对应的记录并更新结论；只有指向不明确时才追问。",
      points: [
        "用数据、截图、commit 或用户反馈完成结果回看。",
        "结论可以是有效、无效或不确定，不强迫成功叙事。",
        "修正时同步修改依据和来源可信度。",
      ],
    },
    en: {
      title: "Review outcomes and correct",
      subtitle: "Let evidence make the record more accurate",
      lead: "Project memory is not a one-time archive. Describe later results normally; the Agent identifies the relevant record and updates the conclusion, asking only when the target is ambiguous.",
      points: [
        "Use data, screenshots, commits, or user feedback to review the outcome.",
        "A result can be effective, ineffective, or uncertain. Do not force a success story.",
        "When correcting a record, update both its evidence and source trust.",
      ],
    },
  },
];

const app = document.querySelector("#app");
const loadingState = document.querySelector("#loading-state");
const densityToggle = document.querySelector("#density-toggle");
const languageToggle = document.querySelector("#language-toggle");

const state = {
  locale: readChoiceSetting("buildtrace-locale", ["zh", "en"], "zh"),
  density: readChoiceSetting("buildtrace-density", ["comfortable", "compact"], "comfortable"),
  mode: location.hash === "#tutorial" ? "tutorial" : "board",
  lens: "trace",
  query: "",
  status: "all",
  scene: "all",
  selectedEntryId: null,
  detailOpen: false,
  mobileContextOpen: false,
  utilityPanel: null,
  tutorialStep: 0,
  completedSteps: new Set(readTutorialProgress()),
  trace: null,
};

function readSetting(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function readChoiceSetting(key, choices, fallback) {
  const value = readSetting(key, fallback);
  return choices.includes(value) ? value : fallback;
}

function readJSONSetting(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function readTutorialProgress() {
  const value = readJSONSetting("buildtrace-tutorial", []);
  if (!Array.isArray(value)) return [];
  return value.filter((step) => Number.isInteger(step) && step >= 0 && step < tutorialSteps.length);
}

function saveSetting(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The Viewer remains fully usable when storage is unavailable.
  }
}

function t(key) {
  return translations[state.locale][key] ?? key;
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applyChromeState() {
  document.documentElement.lang = state.locale === "zh" ? "zh-CN" : "en";
  document.body.dataset.density = state.density;
  document.body.classList.toggle("detail-open", state.detailOpen);
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });
  document.querySelectorAll("[data-language-option]").forEach((element) => {
    element.classList.toggle("is-active", element.dataset.languageOption === state.locale);
  });
  document.querySelector("#density-label").textContent = t(state.density);
  document.querySelectorAll("[data-mode]").forEach((button) => {
    if (button.dataset.mode === state.mode) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(`${value}T00:00:00`);
  const isExactDate =
    !Number.isNaN(date.valueOf()) &&
    date.getFullYear() === Number(value.slice(0, 4)) &&
    date.getMonth() + 1 === Number(value.slice(5, 7)) &&
    date.getDate() === Number(value.slice(8, 10));
  if (!isExactDate) return value;
  return new Intl.DateTimeFormat(state.locale === "zh" ? "zh-CN" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatSignalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [, month, day] = value.split("-");
  if (state.locale === "zh") return `${Number(month)}.${day}`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
}

function statusLabel(status) {
  const map = {
    待观察: t("pending"),
    有效: t("valid"),
    不确定: t("uncertain"),
    无效: state.locale === "zh" ? "无效" : "Ineffective",
  };
  return map[status] ?? status;
}

function sceneLabel(scene) {
  const labels = {
    feature: ["功能", "Feature"],
    bugfix: ["问题修复", "Bug fix"],
    "ux-content": ["体验与内容", "UX & content"],
    "seo-growth": ["增长与搜索", "Growth & search"],
    "analytics-data": ["数据与分析", "Data & analytics"],
    monetization: ["商业化", "Monetization"],
    architecture: ["架构", "Architecture"],
    "ops-release": ["发布与运维", "Release & operations"],
    "ai-workflow": ["AI 工作流", "AI workflow"],
    decision: ["产品决策", "Product decision"],
  };
  return labels[scene]?.[state.locale === "zh" ? 0 : 1] ?? scene;
}

function trustLabel(trust) {
  const labels = {
    confirmed: ["来源已确认", "Confirmed source"],
    inferred: ["来源为推断", "Inferred source"],
    unknown: ["来源待确认", "Source unknown"],
  };
  return labels[trust]?.[state.locale === "zh" ? 0 : 1] ?? trust;
}

function visibilityLabel(visibility) {
  const labels = {
    private: ["私密", "Private"],
    team: ["团队", "Team"],
    public: ["公开", "Public"],
  };
  return labels[visibility]?.[state.locale === "zh" ? 0 : 1] ?? visibility;
}

function resourceCategoryLabel(category) {
  const labels = {
    code: ["代码", "Code"],
    docs: ["文档", "Docs"],
    reference: ["参考", "Reference"],
    data: ["数据", "Analytics"],
    deploy: ["部署", "Deploy"],
    finance: ["支付", "Payments"],
    admin: ["后台", "Admin"],
    design: ["设计", "Design"],
    community: ["社区", "Community"],
    view: ["看板", "View"],
    agent: ["Agent", "Agent"],
    release: ["版本", "Release"],
    other: ["其他", "Other"],
  };
  return labels[category]?.[state.locale === "zh" ? 0 : 1] ?? category;
}

function renderRecordTag(value, kind, label = "") {
  return `<span class="record-tag" data-kind="${escapeHTML(kind)}">${label ? `<span>${escapeHTML(label)}</span>` : ""}<strong>${escapeHTML(value)}</strong></span>`;
}

function resultCountLabel(count) {
  if (state.locale === "zh") return `${count} 条匹配记录`;
  return `${count} matching record${count === 1 ? "" : "s"}`;
}

function render() {
  applyChromeState();
  if (!state.trace) return;
  app.innerHTML = state.mode === "board" ? renderBoard() : renderTutorial();
  applyDetailIsolation();
}

function applyDetailIsolation() {
  const isolated = state.detailOpen && window.matchMedia("(max-width: 1180px)").matches;
  for (const element of [document.querySelector(".topbar"), document.querySelector(".board-sidebar"), document.querySelector(".workbench-main"), document.querySelector(".mobile-nav")]) {
    element?.toggleAttribute("inert", isolated);
  }
}

function renderBoard() {
  const stats = getBuildtraceStats(state.trace.entries);
  const scenes = [...new Set(state.trace.entries.map((entry) => entry.scene).filter(Boolean))];
  const query = state.query.trim().toLowerCase();
  const visibleEntries = state.trace.entries.filter((entry) => {
    const matchesStatus =
      state.status === "all" ||
      (state.status === "pending" && entry.status === "待观察") ||
      (state.status === "effective" && entry.status === "有效") ||
      (state.status === "uncertain" && entry.status === "不确定") ||
      (state.status === "ineffective" && entry.status === "无效");
    const matchesScene = state.scene === "all" || entry.scene === state.scene;
    const haystack = [
      entry.title,
      entry.evidence,
      entry.scene,
      sceneLabel(entry.scene),
      statusLabel(entry.status),
      trustLabel(entry.sourceTrust),
      ...Object.values(entry.sections),
    ]
      .join(" ")
      .toLowerCase();
    return matchesStatus && matchesScene && (!query || haystack.includes(query));
  });

  if (!state.selectedEntryId || !visibleEntries.some((entry) => entry.id === state.selectedEntryId)) {
    state.selectedEntryId = visibleEntries[0]?.id ?? null;
  }
  const selected = state.trace.entries.find((entry) => entry.id === state.selectedEntryId);
  const uncertainCount = state.trace.entries.filter((entry) => entry.status === "不确定").length;
  const ineffectiveCount = state.trace.entries.filter((entry) => entry.status === "无效").length;
  const evidenceTokens = getEvidenceTokens(state.trace.entries);
  const isPrivateSource = (state.trace.publication?.profile || "private") === "private";

  return `
    <section class="board-view workbench-shell">
      <aside class="board-sidebar ${state.mobileContextOpen ? "is-context-open" : ""}" aria-label="${t("recordIndex")}">
        <div class="side-project">
          <span class="side-project-mark">BT</span>
          <div><strong>${escapeHTML(state.trace.title)}</strong><small>${t("brandTagline")}</small></div>
        </div>
        <button class="mobile-context-toggle" type="button" data-action="toggle-context" aria-expanded="${state.mobileContextOpen}">
          <span><strong>${t("projectContext")}</strong><small>${t("projectContextNote")}</small></span><b aria-hidden="true">${state.mobileContextOpen ? "−" : "+"}</b>
        </button>
        <div class="side-context-body">
        <section class="side-section">
          <p class="side-heading">${t("records")}</p>
          <div class="side-nav">
            ${renderSideFilter("all", t("totalRecords"), stats.total)}
            ${renderSideFilter("pending", t("pendingReview"), stats.pending)}
            ${renderSideFilter("effective", t("effective"), stats.effective)}
            ${renderSideFilter("uncertain", t("uncertain"), uncertainCount)}
            ${renderSideFilter("ineffective", t("ineffective"), ineffectiveCount)}
          </div>
        </section>
        ${isPrivateSource ? `<section class="side-section resource-section">
          <p class="side-heading">${t("projectResources")}</p>
          ${renderResources(state.trace.resources)}
        </section>
        <section class="side-section side-automation">
          <details>
            <summary><span>${t("automationDetails")}</span><b aria-hidden="true">+</b></summary>
            <div class="workflow-list">
              ${renderWorkflow("01", t("restoreContext"), t("restoreContextNote"), state.locale === "zh" ? "恢复上下文：读取项目初心、最近 5 条记录和所有到期回看" : "Restore context: read project intent, the latest five records, and all due reviews")}
              ${renderWorkflow("02", t("recordSession"), t("recordSessionNote"), state.locale === "zh" ? "记录本轮：根据本轮对话、文件变化和验证结果起草 BuildTrace 节点" : "Record this session: draft a BuildTrace record from the dialogue, file changes, and verification")}
              ${renderWorkflow("03", t("reviewDue"), t("reviewDueNote"), state.locale === "zh" ? "回看所有到期记录：用现有证据补充真实结果" : "Review all due records and add real outcomes supported by available evidence")}
              ${renderWorkflow("04", t("fillGaps"), t("fillGapsNote"), state.locale === "zh" ? "检查 BuildTrace，只追问会影响判断的关键缺口" : "Inspect BuildTrace and ask only about critical gaps that affect judgment")}
            </div>
            <p class="side-heading evidence-heading">${t("sourceCoverage")}</p>
            <div class="evidence-cloud">${evidenceTokens.length ? evidenceTokens.map((token) => `<span>${escapeHTML(token)}</span>`).join("") : `<small>${t("evidenceMissing")}</small>`}</div>
          </details>
        </section>` : ""}
        </div>
      </aside>

      <section class="workbench-main">
        <header class="workbench-header trace-hero">
          <div class="trace-hero-copy">
            <p class="eyebrow">${t("boardEyebrow")}</p>
            <h1>${t("heroTitle")}</h1>
            <p>${t("heroNote")}</p>
          </div>
          <div class="trace-hero-actions">
            <span class="source-mode">${escapeHTML(profileLabel(state.trace.publication?.profile))} · ${t("sourceMode")}</span>
            <div>
              <a class="source-link" href="../BUILDTRACE.md" target="_blank" rel="noreferrer">${t("openSource")}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg></a>
              <a class="hero-action" href="../BUILDTRACE.md" download="BUILDTRACE.md">${t("downloadSource")}</a>
              ${isPrivateSource ? `<button class="hero-action is-primary" type="button" data-copy-command="${state.locale === "zh" ? "新节点草稿：根据本轮对话、实际文件改动和验证证据，起草一条 BuildTrace 记录；不确定的内容标记 unknown，不要编造。" : "New record draft: use this session, actual file changes, and verification evidence to draft a BuildTrace record. Mark uncertain details as unknown and do not invent facts."}">${t("newRecordDraft")}</button>` : ""}
            </div>
          </div>
        </header>
        ${renderHumanPurpose(state.trace.humanPurpose)}
        <section class="workbench-signals" aria-label="${t("projectSignals")}">
          ${renderSignal("01", t("totalRecords"), stats.total)}
          ${renderSignal("02", t("pendingReview"), stats.pending, stats.due > 0)}
          ${renderSignal("03", t("effective"), stats.effective)}
          ${renderSignal("04", t("nextReview"), stats.nextReview ? formatSignalDate(stats.nextReview) : t("noReview"))}
        </section>
        ${renderLensNavigation()}
        ${renderReviewTracks(state.trace.entries, state.lens !== "review")}
        ${renderDecisionPlaybook(state.trace.decisionPrinciples, state.lens !== "playbook")}
        ${renderResourceVault(state.trace.resources, state.lens !== "trace" || !isPrivateSource)}
        <section class="deployment-panel" aria-labelledby="deployment-title" ${state.lens !== "trace" || !isPrivateSource ? "hidden" : ""}>
          <div class="deployment-head">
            <div>
              <h2 id="deployment-title">${t("deploymentTitle")}</h2>
              <p>${t("deploymentNote")}</p>
            </div>
            <div class="deployment-head-actions">
              <span class="deployment-status">${t("deploymentStatus")}</span>
              <button class="panel-action" type="button" data-action="open-deploy-guide">${t("deploymentGuide")}</button>
            </div>
          </div>
          <div class="deployment-grid">
            <button class="deployment-card" type="button" data-action="open-deploy-guide"><strong>Vercel</strong><span>${t("deploymentVercelNote")}</span><small>${t("deploymentVercelTag")}</small></button>
            <button class="deployment-card" type="button" data-action="open-deploy-guide"><strong>Cloudflare Pages</strong><span>${t("deploymentCloudflareNote")}</span><small>${t("deploymentCloudflareTag")}</small></button>
            <button class="deployment-card" type="button" data-action="open-deploy-guide"><strong>GitHub Pages</strong><span>${t("deploymentGithubNote")}</span><small>${t("deploymentGithubTag")}</small></button>
            <button class="deployment-card" type="button" data-action="open-deploy-guide"><strong>${t("deploymentDomestic")}</strong><span>${t("deploymentDomesticNote")}</span><small>${t("deploymentDomesticTag")}</small></button>
          </div>
        </section>
        <section class="timeline-panel" aria-label="${t("timelineOverview")}" ${state.lens !== "trace" ? "hidden" : ""}>
          <div class="panel-heading"><div><strong>${t("timelineOverview")}</strong><small>${state.locale === "zh" ? "按时间找回项目判断" : "Recover decisions over time"}</small></div><span>${state.trace.entries.length}</span></div>
          <div class="timeline-track">
            ${[...state.trace.entries].reverse().map((entry) => `<button type="button" data-entry-id="${escapeHTML(entry.id)}" data-entry-context="timeline" aria-current="${entry.id === state.selectedEntryId}"><span>${escapeHTML(entry.date)}</span><strong>${escapeHTML(entry.title)}</strong><small>${escapeHTML(sceneLabel(entry.scene))} · ${escapeHTML(statusLabel(entry.status))}</small></button>`).join("")}
          </div>
        </section>
        <section class="records-panel" ${state.lens !== "trace" ? "hidden" : ""}>
          <div class="panel-heading records-heading"><div><strong>${t("records")}</strong><small>${resultCountLabel(visibleEntries.length)}</small></div></div>
          <div class="workspace-tools">
            <label class="search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg><span class="sr-only">${t("search")}</span><input id="record-search" type="search" value="${escapeHTML(state.query)}" placeholder="${escapeHTML(t("search"))}" autocomplete="off" /></label>
            <div class="scene-filter" aria-label="${t("scene")}">
              <button type="button" data-scene-filter="all" aria-pressed="${state.scene === "all"}">${t("allScenes")}</button>
              ${scenes.map((scene) => `<button type="button" data-scene-filter="${escapeHTML(scene)}" aria-pressed="${state.scene === scene}">${escapeHTML(sceneLabel(scene))}</button>`).join("")}
            </div>
          </div>
          <div class="mobile-status-filters" aria-label="${t("statusFilter")}">${renderFilter("all", t("all"))}${renderFilter("pending", t("pending"))}${renderFilter("effective", t("valid"))}${renderFilter("uncertain", t("uncertain"))}${renderFilter("ineffective", t("ineffective"))}</div>
          <p class="sr-only" role="status">${resultCountLabel(visibleEntries.length)}</p>
          ${renderRecordList(visibleEntries)}
        </section>
      </section>
      <section class="detail-pane detail-rail ${state.detailOpen ? "is-open" : ""}" aria-label="${t("selectedRecordDetail")}" tabindex="-1">
          <button class="detail-close" type="button" data-action="close-detail">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
            ${t("backToRecords")}
          </button>
          ${selected ? renderDetail(selected) : ""}
      </section>
      <div class="toast" id="toast" hidden role="status"></div>
      ${renderUtilityPanel()}
    </section>
  `;
}

function renderSideFilter(value, label, count) {
  return `<button type="button" data-status-filter="${value}" aria-pressed="${state.status === value}"><span>${escapeHTML(label)}</span><strong>${count}</strong></button>`;
}

function profileLabel(profile = "private") {
  return t(profile === "public" ? "profilePublic" : profile === "team" ? "profileTeam" : "profilePrivate");
}

function profileNote(profile = "private") {
  return t(profile === "public" ? "profilePublicNote" : profile === "team" ? "profileTeamNote" : "profilePrivateNote");
}

function renderLensNavigation() {
  const profile = state.trace.publication?.profile || "private";
  const lenses = [
    ["trace", "01", t("traceLens"), t("traceLensNote")],
    ["review", "02", t("reviewLens"), t("reviewLensNote")],
    ["playbook", "03", t("playbookLens"), t("playbookLensNote")],
  ];
  return `<section class="lens-console" aria-label="${t("workbench")}">
    <nav class="lens-nav">${lenses.map(([value, index, label, note]) => `<button type="button" data-lens="${value}" aria-pressed="${state.lens === value}"><span>${index}</span><strong>${escapeHTML(label)}</strong><small>${escapeHTML(note)}</small></button>`).join("")}</nav>
    <div class="profile-strip" data-profile="${escapeHTML(profile)}"><span>${t("visibility")}</span><strong>${escapeHTML(profileLabel(profile))}</strong><p>${escapeHTML(profileNote(profile))}</p></div>
  </section>`;
}

function structuredItemText(item) {
  if (typeof item === "string") return item;
  const facts = [item.metric, item.value, item.change, item.window, item.rule]
    .filter(Boolean)
    .join(" · ");
  return [item.text, facts].filter(Boolean).join(" — ");
}

function renderReviewStage(index, label, values) {
  const items = values.map(structuredItemText).filter(Boolean);
  return `<div class="review-stage ${items.length ? "" : "is-empty"}"><span>${index}</span><div><strong>${escapeHTML(label)}</strong>${items.length ? `<ul>${items.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>` : `<p>${t("noStructuredValue")}</p>`}</div></div>`;
}

function renderReviewTracks(entries, hidden = false) {
  const tracks = entries.filter((entry) => entry.hypotheses?.length || entry.watchPlans?.length || entry.dataChanges?.length || entry.outcomes?.length);
  const content = tracks.length ? `<div class="review-track-list">${tracks.map((entry) => {
    const actions = entry.sectionItems?.changes?.length ? entry.sectionItems.changes : (entry.sections.changes ? [entry.sections.changes] : []);
    const evidence = [...(entry.dataChanges || []), ...(entry.watchPlans || [])];
    const judgments = entry.outcomes?.length ? entry.outcomes : (entry.sections.result ? [entry.sections.result] : []);
    return `<article class="review-track-card">
      <button class="review-track-head" type="button" data-entry-id="${escapeHTML(entry.id)}"><span>${escapeHTML(entry.date)}</span><strong>${escapeHTML(entry.title)}</strong><small>${escapeHTML(statusLabel(entry.status))} ↗</small></button>
      <div class="review-track-grid">
        ${renderReviewStage("01", t("reviewHypothesis"), entry.hypotheses || [])}
        ${renderReviewStage("02", t("reviewAction"), actions)}
        ${renderReviewStage("03", t("reviewEvidence"), evidence)}
        ${renderReviewStage("04", t("reviewJudgment"), judgments)}
      </div>
    </article>`;
  }).join("")}</div>` : `<div class="lens-empty"><strong>${t("reviewTrackEmpty")}</strong><p>${t("reviewTrackEmptyNote")}</p><button type="button" data-copy-command="${state.locale === "zh" ? "记录一个复盘轨：保留我的原始假设，写清实际动作、观察指标、数据源、基线、目标和时间窗口；没有的数据不要编造。" : "Record a review track: keep my original hypothesis, actual action, metric, source, baseline, target, and observation window. Do not invent missing data."}">${t("newRecordDraft")}</button></div>`;
  return `<section class="lens-workspace review-workspace" ${hidden ? "hidden" : ""}><header><p class="eyebrow">HYPOTHESIS / ACTION / EVIDENCE / JUDGMENT</p><h2>${t("reviewTrackTitle")}</h2><p>${t("reviewTrackNote")}</p></header>${content}</section>`;
}

function renderDecisionPlaybook(principles = [], hidden = false) {
  const groups = new Map();
  for (const principle of principles) {
    if (!groups.has(principle.id)) groups.set(principle.id, []);
    groups.get(principle.id).push(principle);
  }
  const cards = [...groups.entries()].map(([id, evidence]) => {
    const variants = [...new Set(evidence.map((item) => `${item.category}\u0000${item.text}`))];
    const status = variants.length > 1 ? "conflict" : evidence.length > 1 ? "repeated" : "candidate";
    const label = t(status === "conflict" ? "decisionConflict" : status === "repeated" ? "decisionRepeated" : "decisionCandidate");
    return `<article class="principle-card" data-status="${status}"><div class="principle-kicker"><code>${escapeHTML(id)}</code><span>${escapeHTML(label)}</span></div><h3>${escapeHTML(evidence[0].text)}</h3><p>${escapeHTML(evidence[0].category)}</p><details><summary>${t("decisionEvidence")} · ${evidence.length}</summary><ul>${evidence.map((item) => `<li><button type="button" data-entry-id="${escapeHTML(item.recordId)}"><span>${escapeHTML(item.recordDate)}</span>${escapeHTML(item.recordTitle)}</button></li>`).join("")}</ul></details>${variants.length > 1 ? `<div class="principle-conflict">${variants.map((variant) => `<p>${escapeHTML(variant.split("\u0000")[1])}</p>`).join("")}</div>` : ""}</article>`;
  });
  const command = "node bin/buildtrace.mjs playbook --target /path/to/project-a --target /path/to/project-b --output personal-decision-playbook.md";
  const content = cards.length ? `<div class="principle-grid">${cards.join("")}</div>` : `<div class="lens-empty"><strong>${t("noDecisionPrinciples")}</strong><p>${t("noDecisionPrinciplesNote")}</p></div>`;
  return `<section class="lens-workspace playbook-workspace" ${hidden ? "hidden" : ""}><header class="playbook-head"><div><p class="eyebrow">STABLE PRINCIPLES / REAL EVIDENCE</p><h2>${t("decisionPlaybookTitle")}</h2><p>${t("decisionPlaybookNote")}</p></div><button type="button" data-copy-command="${escapeHTML(command)}">${t("crossProjectCommand")}</button></header>${content}</section>`;
}

function renderResources(resources = []) {
  if (!resources.length) return `<p class="side-empty">${t("noResources")}</p>`;
  return `<div class="resource-list">${resources.map((resource) => {
    const href = getResourceHref(resource);
    const content = `<span data-resource-kind="${escapeHTML(resource.category)}">${escapeHTML(resource.label.slice(0, 1))}</span><div><strong>${escapeHTML(resource.title)}</strong><small>${escapeHTML(resource.note || resource.url)}</small></div><b>${href ? "↗" : "—"}</b>`;
    return href
      ? `<a href="${escapeHTML(href)}" target="_blank" rel="noreferrer">${content}</a>`
      : `<span class="resource-item is-disabled">${content}</span>`;
  }).join("")}</div>`;
}

function renderHumanPurpose(purpose) {
  if (!purpose) return "";
  const paragraphs = purpose.split(/\n+/).filter(Boolean);
  const lead = paragraphs[0];
  return `<details class="human-purpose"><summary><span>${t("humanPurpose")}</span><strong>${escapeHTML(lead)}</strong><b>${t("humanPurposeExpand")} +</b></summary><div>${paragraphs.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("")}</div></details>`;
}

function getResourceHref(resource) {
  try {
    const buildtraceBase = new URL("../", window.location.href);
    const projectBase = new URL("../../../", window.location.href);
    const value = resource.url.replace(/^`|`$/g, "");
    const resolved = new URL(value, value.startsWith("docs/") ? projectBase : buildtraceBase);
    return ["http:", "https:"].includes(resolved.protocol) ? resolved.href : null;
  } catch {
    return null;
  }
}

function renderResourceVault(resources = [], hidden = false) {
  const cards = resources.length
    ? resources.map((resource) => {
      const href = getResourceHref(resource);
      const content = `<span class="resource-card-mark" data-resource-kind="${escapeHTML(resource.category)}">${escapeHTML(resource.label.slice(0, 1))}</span><span class="resource-card-copy"><span><strong>${escapeHTML(resource.title)}</strong><small>${escapeHTML(resourceCategoryLabel(resource.category))}</small></span>${resource.note ? `<p>${escapeHTML(resource.note)}</p>` : ""}<em>${escapeHTML(resource.url)}</em></span><b aria-hidden="true">${href ? "↗" : "—"}</b>`;
      return href
        ? `<a class="project-resource-card" href="${escapeHTML(href)}" target="_blank" rel="noreferrer">${content}</a>`
        : `<span class="project-resource-card is-disabled">${content}</span>`;
    }).join("")
    : `<div class="resource-vault-empty"><strong>${t("noResources")}</strong><span>${t("readonlyReminder")}</span></div>`;

  return `<section class="resource-vault-panel" aria-labelledby="resource-vault-title" ${hidden ? "hidden" : ""}><div class="resource-vault-head"><div><h2 id="resource-vault-title">${t("resourceVault")}</h2><p>${t("resourceVaultNote")}</p></div><button class="panel-action" type="button" data-action="open-resource-builder">${t("addResource")}</button></div><div class="project-resource-grid">${cards}</div></section>`;
}

function renderUtilityPanel() {
  if (!state.utilityPanel) return "";
  const body = state.utilityPanel === "resource" ? renderResourceBuilder() : renderDeployGuide();
  return `<div class="utility-backdrop" data-action="close-utility"><section class="utility-drawer" role="dialog" aria-modal="true" aria-label="${escapeHTML(state.utilityPanel === "resource" ? t("resourceBuilderTitle") : t("deploymentDrawerTitle"))}" data-utility-drawer><button class="utility-close" type="button" data-action="close-utility" aria-label="${t("close")}">×</button>${body}</section></div>`;
}

function renderResourceBuilder() {
  const categories = ["code", "docs", "reference", "data", "deploy", "finance", "admin", "design", "community", "other"];
  return `<div class="utility-heading"><p class="eyebrow">READ-ONLY HANDOFF</p><h2>${t("resourceBuilderTitle")}</h2><p>${t("resourceBuilderNote")}</p></div><form class="resource-builder" id="resource-builder"><label><span>${t("resourceTitle")}</span><input name="title" required autocomplete="off" placeholder="${state.locale === "zh" ? "例如：PostHog 产品数据" : "e.g. PostHog product analytics"}" /></label><label><span>${t("resourceURL")}</span><input name="url" required autocomplete="off" placeholder="https://… / ./docs/…" /></label><label><span>${t("resourceCategory")}</span><select name="category">${categories.map((category) => `<option value="${category}">${escapeHTML(resourceCategoryLabel(category))}</option>`).join("")}</select></label><label><span>${t("resourceNote")}</span><textarea name="note" rows="3" placeholder="${state.locale === "zh" ? "例如：复盘自然搜索与关键行为时查看" : "e.g. Use when reviewing organic search and key behavior"}"></textarea></label><p class="readonly-note">${t("readonlyReminder")}</p><button class="utility-primary" type="submit">${t("copyResourceCommand")}</button></form>`;
}

function renderDeployGuide() {
  const localCommand = "node docs/buildtrace/viewer/serve.mjs";
  const teamCommand = "node bin/buildtrace.mjs publish --profile team --target . --output .buildtrace/team-site";
  const publicCommand = "node bin/buildtrace.mjs publish --profile public --target . --output .buildtrace/public-site";
  const githubCommand = "node bin/buildtrace.mjs deploy-kit --provider github-pages --target .";
  const teamNote = state.locale === "zh" ? "生成已移除私密记录和内部路径的团队快照；部署时仍要配置访问控制。" : "Generate a team snapshot without private records and internal paths; add access control when hosting.";
  const publicNote = state.locale === "zh" ? "只发布明确标为 public 的记录；原话、Agent 过程和技术路径在生成阶段删除。" : "Publish only explicitly public records; original words, Agent process, and technical paths are removed at generation time.";
  return `<div class="utility-heading"><p class="eyebrow">PRIVATE BY DEFAULT</p><h2>${t("deploymentDrawerTitle")}</h2><p>${t("deploymentDrawerNote")}</p></div><div class="privacy-warning"><strong>${t("privacyFirst")}</strong><p>${t("privacyNote")}</p></div><div class="deploy-options">${renderDeployOption(t("localPrivate"), t("localPrivateNote"), localCommand, "01")}${renderDeployOption(t("profileTeam"), teamNote, teamCommand, "02")}${renderDeployOption(t("profilePublic"), publicNote, publicCommand, "03")}${renderDeployOption("GitHub Pages", t("deploymentGithubNote"), githubCommand, "04")}</div><a class="deploy-doc-link" href="../DEPLOY.md" target="_blank" rel="noreferrer">${t("openDeployDoc")} ↗</a>`;
}

function renderDeployOption(title, note, command, index) {
  return `<article class="deploy-option"><span>${index}</span><div><strong>${escapeHTML(title)}</strong><p>${escapeHTML(note)}</p><code>${escapeHTML(command)}</code></div><button type="button" data-copy-command="${escapeHTML(command)}">${t("copyCommand")}</button></article>`;
}

function renderWorkflow(index, label, note, command) {
  return `<button type="button" data-copy-command="${escapeHTML(command)}"><span>${index}</span><div><strong>${escapeHTML(label)}</strong><small>${escapeHTML(note)}</small></div></button>`;
}

function getEvidenceTokens(entries) {
  return [...new Set(entries.flatMap((entry) => entry.evidence.split(/[；;，,]/).map((item) => item.trim()).filter(Boolean)).map((item) => item.replace(/^`|`$/g, "")))].slice(0, 8);
}

function renderSignal(index, label, value, alert = false) {
  return `
    <div class="signal ${alert ? "is-alert" : ""}">
      <span class="signal-label"><span>${escapeHTML(label)}</span><span>${index}</span></span>
      <strong class="signal-value">${escapeHTML(value)}</strong>
    </div>
  `;
}

function renderFilter(value, label) {
  return `<button class="filter-chip" type="button" data-status-filter="${value}" aria-pressed="${state.status === value}">${escapeHTML(label)}</button>`;
}

function renderRecordList(entries) {
  if (!entries.length) {
    const published = state.trace.publication?.profile && state.trace.publication.profile !== "private";
    return `<div class="empty-list"><strong>${t(published ? "noPublishedRecords" : "noResults")}</strong><span>${t(published ? "noPublishedRecordsHint" : "noResultsHint")}</span></div>`;
  }

  return `
    <ol class="record-list">
      ${entries
        .map(
          (entry) => `
            <li>
              <button class="record-button" type="button" data-entry-id="${escapeHTML(entry.id)}" aria-current="${entry.id === state.selectedEntryId}">
                <span class="record-date">${escapeHTML(entry.date.slice(5).replace("-", "."))}</span>
                <span class="record-copy">
                  <strong>${escapeHTML(entry.title)}</strong>
                  ${entry.sections.summary ? `<span class="record-summary">${escapeHTML(entry.sections.summary)}</span>` : ""}
                  <span class="record-tags" aria-label="${t("recordTags")}">
                    ${renderRecordTag(sceneLabel(entry.scene), "scene")}
                    ${renderRecordTag(statusLabel(entry.status), `status-${entry.status}`)}
                    ${renderRecordTag(visibilityLabel(entry.visibility), `visibility-${entry.visibility}`)}
                  </span>
                </span>
                <span class="status-dot" data-status="${escapeHTML(entry.status)}" aria-hidden="true"></span>
              </button>
            </li>
          `,
        )
        .join("")}
    </ol>
  `;
}

function renderDetail(entry) {
  const relatedEntries = state.trace.entries
    .filter((candidate) => candidate.id !== entry.id && candidate.scene === entry.scene)
    .slice(0, 3);
  return `
    <article class="detail-article">
      <p class="detail-overline">${t("recordTags")}</p>
      <div class="detail-kicker" aria-label="${t("recordTags")}">
        ${renderRecordTag(sceneLabel(entry.scene), "scene", t("recordKind"))}
        ${renderRecordTag(statusLabel(entry.status), `status-${entry.status}`, t("resultStatus"))}
        ${renderRecordTag(trustLabel(entry.sourceTrust), `trust-${entry.sourceTrust}`, t("sourceTrust"))}
        ${renderRecordTag(visibilityLabel(entry.visibility), `visibility-${entry.visibility}`, t("visibility"))}
      </div>
      <h2>${escapeHTML(entry.title)}</h2>
      <div class="detail-date">${escapeHTML(formatDate(entry.date))}${entry.reviewDate !== "无" ? `<span>${t("reviewDate")} ${escapeHTML(formatDate(entry.reviewDate))}</span>` : ""}</div>
      ${renderQuoteDisclosure(entry)}
      ${renderItemSection(t("summary"), entry.sectionItems?.summary, entry.sections.summary, "detail-summary")}
      ${(entry.sections.agentUnderstanding || entry.sections.agentPlan) ? `<div class="agent-thinking-grid">
        ${renderItemSection(t("agentUnderstanding"), entry.sectionItems?.agentUnderstanding, entry.sections.agentUnderstanding, "agent-thinking-card")}
        ${renderItemSection(t("agentPlan"), entry.sectionItems?.agentPlan, entry.sections.agentPlan, "agent-thinking-card")}
      </div>` : ""}
      <section class="causal-section"><h3>${t("causalChain")}</h3><ol class="causal-list">
        ${renderCausalStep("01", t("why"), entry.sections.why)}
        ${renderCausalStep("02", t("changes"), entry.sections.changes)}
        ${renderCausalStep("03", t("evidenceSource"), entry.evidence)}
        ${renderCausalStep("04", t("resultReview"), entry.sections.result || (state.locale === "zh" ? "尚未回看。" : "Not reviewed yet."))}
      </ol></section>
      ${(entry.hypotheses?.length || entry.watchPlans?.length || entry.dataChanges?.length || entry.outcomes?.length || entry.decisionPrinciples?.length) ? `<div class="structured-review-detail">
        ${renderStructuredSection(t("reviewHypothesis"), entry.hypotheses, "hypothesis")}
        ${renderStructuredSection(t("reviewEvidence"), [...(entry.watchPlans || []), ...(entry.dataChanges || [])], "evidence")}
        ${renderStructuredSection(t("reviewJudgment"), entry.outcomes, "judgment")}
        ${renderStructuredSection(t("decisionPlaybookTitle"), entry.decisionPrinciples, "principle")}
      </div>` : ""}
      ${renderItemSection(t("executionTrace"), entry.sectionItems?.executionTrace, entry.sections.executionTrace, "execution-trace-card")}
      ${entry.sections.technical ? `<section class="technical-card"><h3>${t("technicalNotes")}</h3><p>${escapeHTML(entry.sections.technical)}</p></section>` : ""}
      ${relatedEntries.length ? `<section class="related-section"><div class="related-heading"><div><h3>${t("relatedRecords")}</h3><p>${t("relatedRecordsNote")} · ${escapeHTML(sceneLabel(entry.scene))}</p></div><span>${relatedEntries.length}</span></div><div class="related-list">${relatedEntries.map((related) => `<button type="button" data-entry-id="${escapeHTML(related.id)}" data-entry-context="related"><span>${escapeHTML(related.date.slice(5).replace("-", "."))}</span><strong>${escapeHTML(related.title)}</strong><small>${escapeHTML(statusLabel(related.status))}</small></button>`).join("")}</div></section>` : ""}
      <div class="detail-actions">
        <button class="action-button is-primary" type="button" data-copy-command="${state.locale === "zh" ? `修正「${escapeHTML(entry.title)}」` : `Correct &quot;${escapeHTML(entry.title)}&quot;`}">${t("copyCorrection")}</button>
        <button class="action-button" type="button" data-copy-command="${state.locale === "zh" ? `结果有效 / 无效 / 不确定：${escapeHTML(entry.title)}` : `Outcome effective / ineffective / uncertain: ${escapeHTML(entry.title)}`}">${t("copyReview")}</button>
        <button class="action-button" type="button" data-copy-command="${state.locale === "zh" ? `为「${escapeHTML(entry.title)}」补充依据：` : `Add evidence for &quot;${escapeHTML(entry.title)}&quot;: `}">${t("copyEvidence")}</button>
      </div>
    </article>
  `;
}

function renderQuoteDisclosure(entry) {
  if (!entry.sections.quote) return "";
  const quotes = entry.quotes?.length
    ? entry.quotes
    : [{ id: "Q1", speaker: "unknown", sourceRef: "", fidelity: "unknown", text: entry.sections.quote }];
  const preview = quotes.map((quote) => quote.text).filter(Boolean).join("\n\n");
  return `<details class="detail-quote">
    <summary>
      <span>${t("originalWords")}</span>
      <p>${escapeHTML(preview)}</p>
      <b>${t("showAllQuotes")} · ${quotes.length}</b>
    </summary>
    <div class="detail-quote-full">
      ${quotes.map((quote) => `<article>
        <small>${escapeHTML([quote.id, quote.speaker, quote.fidelity].filter((value) => value && value !== "unknown").join(" · ") || quote.id)}</small>
        <p>${escapeHTML(quote.text || "—")}</p>
        ${quote.sourceRef ? `<code>${escapeHTML(quote.sourceRef)}</code>` : ""}
      </article>`).join("")}
    </div>
  </details>`;
}

function renderItemSection(label, items, fallback, className) {
  const values = items?.length ? items : (fallback ? [fallback] : []);
  if (!values.length) return "";
  return `<section class="${className}"><span>${escapeHTML(label)}</span><ul>${values.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul></section>`;
}

function renderStructuredSection(label, items = [], kind = "") {
  if (!items.length) return "";
  return `<section class="structured-detail-card" data-kind="${escapeHTML(kind)}"><span>${escapeHTML(label)}</span><ul>${items.map((item) => `<li>${escapeHTML(structuredItemText(item))}</li>`).join("")}</ul></section>`;
}

function renderCausalStep(index, label, value) {
  return `<li><span>${index}</span><div><strong>${escapeHTML(label)}</strong><p>${escapeHTML(value || "—")}</p></div></li>`;
}

function renderMetadata(label, value) {
  return `<div class="metadata-item"><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value || "—")}</dd></div>`;
}

function renderTutorial() {
  const step = tutorialSteps[state.tutorialStep][state.locale];
  const completed = state.completedSteps.size;
  const progress = completed / tutorialSteps.length;

  return `
    <section class="tutorial-shell">
      <header class="tutorial-hero">
        <div>
          <p class="eyebrow">${t("tutorialEyebrow")}</p>
          <h1>${escapeHTML(t("tutorialTitle")).replace("\n", "<br>")}</h1>
        </div>
        <div class="tutorial-progress">
          <p class="hero-note">${escapeHTML(t("tutorialNote"))}</p>
          <div class="progress-label"><span>${t("progress")}</span><span>${completed} / ${tutorialSteps.length}</span></div>
          <div class="progress-track"><div class="progress-fill" style="transform:scaleX(${progress})"></div></div>
        </div>
      </header>
      <section class="tutorial-workspace">
        <aside class="tutorial-index" aria-label="${t("tutorialChapters")}">
          ${tutorialSteps
            .map((item, index) => {
              const copy = item[state.locale];
              const isComplete = state.completedSteps.has(index);
              return `
                <button class="tutorial-step ${isComplete ? "is-complete" : ""}" type="button" data-tutorial-step="${index}" aria-current="${index === state.tutorialStep ? "step" : "false"}">
                  <span class="tutorial-number">0${index + 1}</span>
                  <span><strong>${escapeHTML(copy.title)}</strong><small>${escapeHTML(copy.subtitle)}</small></span>
                  <span class="completion-mark" aria-label="${isComplete ? t("completed") : t("markComplete")}">${isComplete ? "✓" : ""}</span>
                </button>
              `;
            })
            .join("")}
        </aside>
        <article class="tutorial-detail">
          <p class="eyebrow">STEP 0${state.tutorialStep + 1}</p>
          <h2>${escapeHTML(step.title)}</h2>
          <p class="tutorial-lead">${escapeHTML(step.lead)}</p>
          <ul class="tutorial-points">
            ${step.points.map((point, index) => `<li><span>0${index + 1}</span><div>${escapeHTML(point)}</div></li>`).join("")}
          </ul>
          ${step.command ? `<div class="command-block"><code>${escapeHTML(step.command)}</code><button class="command-copy" type="button" data-copy-command="${escapeHTML(step.command)}">${t("copy")}</button></div>` : ""}
          <div class="tutorial-footer">
            <button class="action-button is-primary" type="button" data-action="toggle-tutorial-complete">${state.completedSteps.has(state.tutorialStep) ? t("completed") : t("markComplete")}</button>
            ${state.tutorialStep > 0 ? `<button class="action-button" type="button" data-action="previous-tutorial">${t("previous")}</button>` : ""}
            ${state.tutorialStep < tutorialSteps.length - 1 ? `<button class="action-button" type="button" data-action="next-tutorial">${t("next")}</button>` : `<button class="action-button" type="button" data-mode="board">${t("openBoard")}</button>`}
          </div>
        </article>
      </section>
      <div class="toast" id="toast" hidden role="status"></div>
    </section>
  `;
}

function setMode(mode) {
  if (!['board', 'tutorial'].includes(mode)) return;
  state.mode = mode;
  state.detailOpen = false;
  history.replaceState(null, "", mode === "tutorial" ? "#tutorial" : "#board");
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  showToast(t("copied"));
}

document.addEventListener("click", (event) => {
  if (event.target.matches(".utility-backdrop")) {
    state.utilityPanel = null;
    render();
    return;
  }

  const modeButton = event.target.closest("[data-mode]");
  if (modeButton) {
    setMode(modeButton.dataset.mode);
    return;
  }

  const lensButton = event.target.closest("[data-lens]");
  if (lensButton) {
    state.lens = lensButton.dataset.lens;
    state.detailOpen = false;
    render();
    return;
  }

  const recordButton = event.target.closest("[data-entry-id]");
  if (recordButton) {
    if (["timeline", "related"].includes(recordButton.dataset.entryContext)) {
      state.status = "all";
      state.scene = "all";
      state.query = "";
    }
    state.selectedEntryId = recordButton.dataset.entryId;
    state.detailOpen = true;
    render();
    requestAnimationFrame(() => {
      const focusTarget = window.matchMedia("(max-width: 1180px)").matches
        ? document.querySelector(".detail-close")
        : document.querySelector(".detail-pane");
      focusTarget?.focus({ preventScroll: true });
    });
    return;
  }

  const filterButton = event.target.closest("[data-status-filter]");
  if (filterButton) {
    state.status = filterButton.dataset.statusFilter;
    render();
    return;
  }

  const sceneButton = event.target.closest("[data-scene-filter]");
  if (sceneButton) {
    state.scene = sceneButton.dataset.sceneFilter;
    render();
    return;
  }

  const tutorialButton = event.target.closest("[data-tutorial-step]");
  if (tutorialButton) {
    state.tutorialStep = Number(tutorialButton.dataset.tutorialStep);
    render();
    if (window.matchMedia("(max-width: 900px)").matches) {
      requestAnimationFrame(() =>
        document.querySelector(".tutorial-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
    return;
  }

  const copyButton = event.target.closest("[data-copy-command]");
  if (copyButton) {
    copyText(copyButton.dataset.copyCommand);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  if (actionButton.dataset.action === "close-detail") {
    const selectedEntryId = state.selectedEntryId;
    state.detailOpen = false;
    render();
    requestAnimationFrame(() => document.querySelector(`[data-entry-id="${CSS.escape(selectedEntryId)}"]`)?.focus());
  }
  if (actionButton.dataset.action === "toggle-context") {
    state.mobileContextOpen = !state.mobileContextOpen;
    render();
    requestAnimationFrame(() => document.querySelector(".mobile-context-toggle")?.focus());
  }
  if (actionButton.dataset.action === "open-resource-builder") {
    state.utilityPanel = "resource";
    render();
    requestAnimationFrame(() => document.querySelector("#resource-builder input")?.focus());
  }
  if (actionButton.dataset.action === "open-deploy-guide") {
    state.utilityPanel = "deploy";
    render();
    requestAnimationFrame(() => document.querySelector(".utility-close")?.focus());
  }
  if (actionButton.dataset.action === "close-utility") {
    state.utilityPanel = null;
    render();
  }
  if (actionButton.dataset.action === "toggle-tutorial-complete") {
    if (state.completedSteps.has(state.tutorialStep)) {
      state.completedSteps.delete(state.tutorialStep);
    } else {
      state.completedSteps.add(state.tutorialStep);
    }
    saveSetting("buildtrace-tutorial", JSON.stringify([...state.completedSteps]));
    render();
  }
  if (actionButton.dataset.action === "previous-tutorial") {
    state.tutorialStep = Math.max(0, state.tutorialStep - 1);
    render();
  }
  if (actionButton.dataset.action === "next-tutorial") {
    state.tutorialStep = Math.min(tutorialSteps.length - 1, state.tutorialStep + 1);
    render();
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.id !== "resource-builder") return;
  event.preventDefault();
  const data = new FormData(event.target);
  const title = String(data.get("title") || "").trim();
  const url = String(data.get("url") || "").trim();
  const category = String(data.get("category") || "other").trim();
  const note = String(data.get("note") || "").trim();
  if (!title || !url) return;
  const resourceLine = `- [${category}] ${title}: ${url}${note ? ` — ${note}` : ""}`;
  const command = state.locale === "zh"
    ? `把下面项目资料添加到 docs/buildtrace/BUILDTRACE.md 的「项目入口 / 参考资料」中。保留现有入口，不改写项目记录；如果已有同名入口就更新它。\n\n${resourceLine}`
    : `Add the project resource below to the “项目入口 / 参考资料” section in docs/buildtrace/BUILDTRACE.md. Keep existing resources and project records; update the existing item if the name already exists.\n\n${resourceLine}`;
  copyText(command);
});

document.addEventListener("input", (event) => {
  if (event.target.id !== "record-search") return;
  state.query = event.target.value;
  const position = event.target.selectionStart;
  render();
  const nextInput = document.querySelector("#record-search");
  nextInput?.focus();
  nextInput?.setSelectionRange(position, position);
});

densityToggle.addEventListener("click", () => {
  state.density = state.density === "comfortable" ? "compact" : "comfortable";
  saveSetting("buildtrace-density", state.density);
  applyChromeState();
});

languageToggle.addEventListener("click", () => {
  state.locale = state.locale === "zh" ? "en" : "zh";
  saveSetting("buildtrace-locale", state.locale);
  render();
});

window.addEventListener("hashchange", () => {
  const nextMode = location.hash === "#tutorial" ? "tutorial" : "board";
  if (nextMode !== state.mode) setMode(nextMode);
});

window.addEventListener("resize", applyDetailIsolation);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.utilityPanel) {
    state.utilityPanel = null;
    render();
    return;
  }
  if (event.key !== "Escape" || !state.detailOpen) return;
  const selectedEntryId = state.selectedEntryId;
  state.detailOpen = false;
  render();
  requestAnimationFrame(() => document.querySelector(`[data-entry-id="${CSS.escape(selectedEntryId)}"]`)?.focus());
});

async function loadTrace() {
  applyChromeState();
  try {
    const sourceURL = new URL("../BUILDTRACE.md", window.location.href);
    const response = await fetch(sourceURL, { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    state.trace = parseBuildtrace(await response.text());
    if (!state.trace.entries.length && state.trace.publication?.profile === "private") throw new Error("BUILDTRACE.md contains no project records");
    loadingState.hidden = true;
    render();
  } catch (error) {
    loadingState.hidden = true;
    const template = document.querySelector("#error-template");
    app.replaceChildren(template.content.cloneNode(true));
    app.querySelector("[data-error-message]").textContent = `${error.message} · docs/buildtrace/BUILDTRACE.md`;
    applyChromeState();
  }
}

loadTrace();
