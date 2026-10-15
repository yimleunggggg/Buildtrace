import { getBuildtraceStats, parseBuildtrace } from "./parser.js";

const translations = {
  zh: {
    skipToContent: "跳到主要内容",
    primaryNavigation: "主要导航",
    mobileNavigation: "移动端导航",
    switchLanguage: "切换语言",
    projectSignals: "项目概览",
    recordIndex: "项目记录索引",
    statusFilter: "记录筛选",
    selectedRecordDetail: "所选记录详情",
    tutorialChapters: "教程章节",
    brandTagline: "项目记忆",
    board: "看板",
    tutorial: "教程",
    about: "关于",
    aboutTitle: "关于这个项目",
    aboutNote: "了解项目的来由，以及如何记录和查看进展。",
    aboutMaker: "作者的话",
    liveRefresh: "检查文件更新",
    liveRefreshLocal: "保存记录后，看板会刷新",
    liveRefreshNote: "本地看板每 10 秒检查一次记录文件，切到后台会暂停。这只表示文件更新，不代表每轮对话都已保存。线上看板在重新发布后更新。",
    sourceUpdated: "已显示最新保存的记录。",
    sourceUnavailable: "暂时无法检查更新",
    traceLens: "项目脉络",
    reviewLens: "结果回顾",
    playbookLens: "决策手册",
    traceLensNote: "按时间查看关键版本与功能",
    reviewLensNote: "假设 → 动作 → 数据 → 判断",
    playbookLensNote: "收下以后还想用的经验",
    reviewTrackTitle: "动作后来有没有效果",
    reviewTrackNote: "当时期待什么，做完后发生了什么？把后来的数据和反馈放回来一起看。",
    reviewHypothesis: "当时怎么想",
    reviewAction: "做了什么",
    reviewEvidence: "数据变化 / 观察",
    reviewJudgment: "现在怎么看",
    reviewOpen: "查看完整复盘",
    noStructuredValue: "这一步尚未记录",
    reviewTrackEmpty: "还没有需要回看的结果",
    reviewTrackEmptyNote: "可以告诉 AI：“这次先这样做，两周后看有没有改善。”再约好看什么数据。",
    decisionPlaybookTitle: "个人决策手册",
    decisionPlaybookNote: "只收下你确认过的经验，每一条都能找到它来自哪次项目记录。",
    decisionCandidate: "在一个项目中使用",
    decisionRepeated: "反复出现",
    decisionConflict: "有不同说法，待你确认",
    decisionEvidence: "来自真实记录",
    noDecisionPrinciples: "还没有收下的经验",
    noDecisionPrinciplesNote: "遇到以后还想用的做法，告诉 AI：“把这条收进我的决策手册”，并保留对应记录。",
    crossProjectCommand: "汇总多个项目的经验",
    visibility: "可见范围",
    profilePrivate: "仅自己查看",
    profileTeam: "团队版",
    profilePublic: "脱敏公开版",
    profilePrivateNote: "完整内容只在本地项目中读取",
    profileTeamNote: "仅含团队/公开记录；分享时仍需访问控制",
    profilePublicNote: "只含公开记录；原话、内部过程和路径已在生成时移除",
    density: "密度",
    comfortable: "舒展",
    compact: "紧凑",
    loading: "正在打开项目记录…",
    sourceError: "无法读取项目记录",
    sourceHelp: "在项目文件夹运行 buildtrace serve --target .，再打开终端给出的地址。记录文件应位于 docs/buildtrace/BUILDTRACE.md。",
    boardEyebrow: "PROJECT NOTES",
    boardTitle: "记住为什么，\n不只记住做了什么。",
    boardNote: "回到当时的原话、决定和实际进展，看看后来发生了什么。",
    openSource: "查看记录文件",
    totalRecords: "全部记录",
    pendingReview: "等待结果",
    effective: "有效",
    nextReview: "下次补结果",
    milestones: "关键节点",
    dueOutcomes: "需要补结果",
    latestRecord: "最近记录",
    noReview: "暂无",
    search: "搜索记录、原话或资料",
    all: "全部",
    pending: "等待结果",
    valid: "有效",
    uncertain: "暂无结论",
    ineffective: "无效",
    noResults: "没有匹配记录",
    noResultsHint: "换一个关键词，或清除当前筛选。",
    noPublishedRecords: "这个分享版还没有记录",
    noPublishedRecordsHint: "请先让 AI 将要分享的记录设为团队或公开，再重新生成看板。",
    backToRecords: "返回记录",
    sourceTrust: "来源核对",
    evidence: "依据",
    scene: "分类",
    resultStatus: "后来结果",
    reviewDate: "后续回看",
    quote: "沟通原文",
    summary: "这次要做什么",
    why: "为什么做",
    changes: "做了什么",
    technical: "技术备注",
    result: "结果",
    copyCorrection: "纠正这条记录",
    copyReview: "补记后来结果",
    actionHelp: "点击后复制一段话，粘贴给正在使用的 AI，再补充你的说明。",
    copied: "已复制，粘贴给 AI 即可。",
    copyFallback: "浏览器没有授予剪贴板权限。请从下面手动复制：",
    copyPrepared: "下面这段话可以发给 AI。若未自动复制，请选中文字复制。",
    closeCopyPanel: "关闭复制面板",
    tutorialEyebrow: "GETTING STARTED",
    tutorialTitle: "第一次怎么用？",
    tutorialNote: "安装一次，照常和 AI 做项目。这里介绍怎样开始、查看记录和补充结果。",
    progress: "教程进度",
    markComplete: "标记完成",
    completed: "已完成",
    previous: "上一步",
    next: "下一步",
    openBoard: "进入看板",
    copy: "复制",
    workbench: "项目工作台",
    workbenchNote: "先看最近进展，再打开感兴趣的记录。",
    projectResources: "项目入口",
    resourceVault: "项目资料",
    resourceVaultNote: "把常用的文档、数据看板、设计和网站入口放在这里，回顾时方便找到。",
    addResource: "添加项目资料",
    manageResources: "整理资料入口",
    resourceBuilderTitle: "添加一份项目资料",
    resourceBuilderNote: "填好后复制下面的内容，发给 AI 保存。网页不会直接添加资料。",
    resourceTitle: "名称",
    resourceURL: "链接或项目内路径",
    resourceCategory: "分类",
    resourceNote: "什么时候看 / 有什么用",
    copyResourceCommand: "复制给 AI 保存",
    readonlyReminder: "请等 AI 确认保存，再刷新这里查看。",
    workflows: "如何记录",
    sourceCoverage: "记录参考了哪些资料",
    timelineOverview: "关键节点",
    timelineNote: "只展示重要版本、功能、架构变化与项目里程碑",
    noMilestones: "还没有标记关键节点。普通改动仍可在下方项目记录中找到。",
    records: "项目记录",
    allScenes: "全部分类",
    restoreContext: "回顾之前的工作",
    restoreContextNote: "开工前读取相关记录",
    recordSession: "记录这次工作",
    recordSessionNote: "保存原话、做法和验证结果",
    reviewDue: "补充后来的结果",
    reviewDueNote: "把新数据和反馈放回记录",
    fillGaps: "检查遗漏",
    fillGapsNote: "找出影响理解的缺失信息",
    noResources: "尚未记录项目入口",
    evidenceMissing: "尚未记录依据",
    causalChain: "记录详情",
    originalWords: "当时原话",
    showAllQuotes: "展开全部原话",
    agentUnderstanding: "AI 当时怎么理解",
    agentPlan: "AI 打算怎么做",
    executionTrace: "实际做了哪些步骤",
    technicalNotes: "实现与验证",
    evidenceSource: "依据 / 来源",
    resultReview: "结果回看",
    copyEvidence: "补充依据",
    projectContext: "项目与资料",
    projectContextNote: "项目名称、筛选与记录方式",
    recordKind: "事项类型",
    recordTags: "记录分类",
    relatedRecords: "同类记录",
    relatedRecordsNote: "看看这类事情之前怎么处理",
    automationDetails: "让 AI 回顾或补记",
    heroTitle: "别让你的思考埋在 AI 对话里",
    heroNote: "记下当时为什么这样做、做了什么。过段时间回来，接着看进展和结果。",
    humanPurpose: "作者的话",
    humanPurposeExpand: "继续读",
    sourceMode: "记录保存在项目文件里",
    downloadSource: "下载记录",
    newRecordDraft: "让 AI 记录这次工作",
    deploymentTitle: "可部署成线上看板，手机也能看",
    deploymentNote: "可以把看板发布到一个固定网址，方便在手机或其他设备上查看。线上内容会在重新发布后更新。",
    deploymentStatus: "静态站优先",
    deploymentGuide: "查看部署步骤",
    projectTools: "项目工具",
    openResources: "项目资料",
    shareDeploy: "分享 / 部署",
    deploymentDrawerTitle: "在其他设备查看或分享",
    deploymentDrawerNote: "本地地址只在这台电脑上可用。要在手机查看，可以发布团队版或公开版；团队版需要登录保护。",
    privacyFirst: "公开前先检查隐私",
    privacyNote: "记录可能含有聊天原话和内部资料。请使用下面的分享命令生成副本，先检查内容，再发布到网上。",
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
    projectSignals: "Project overview",
    recordIndex: "Project record index",
    statusFilter: "Record filters",
    selectedRecordDetail: "Selected record detail",
    tutorialChapters: "Tutorial chapters",
    brandTagline: "Project memory",
    board: "Board",
    tutorial: "Tutorial",
    about: "About",
    aboutTitle: "About this project",
    aboutNote: "Why this project exists, and how to save and review your work.",
    aboutMaker: "A note from the maker",
    liveRefresh: "Checking file updates",
    liveRefreshLocal: "The board refreshes after records are saved",
    liveRefreshNote: "The local board checks the file every 10 seconds while visible. This does not mean every conversation has been saved. Hosted boards update after you publish again.",
    sourceUpdated: "Showing the latest saved records.",
    sourceUnavailable: "Update check unavailable",
    traceLens: "Project trail",
    reviewLens: "Outcomes",
    playbookLens: "Decision playbook",
    traceLensNote: "Browse major versions and features over time",
    reviewLensNote: "Hypothesis → action → data → judgment",
    playbookLensNote: "Keep lessons you want to use again",
    reviewTrackTitle: "Did the action work later?",
    reviewTrackNote: "What did you expect, and what actually happened? Bring the later data and feedback back to the original record.",
    reviewHypothesis: "What you expected",
    reviewAction: "What changed",
    reviewEvidence: "Data change / observation",
    reviewJudgment: "What you think now",
    reviewOpen: "Open full review",
    noStructuredValue: "Not recorded yet",
    reviewTrackEmpty: "No outcomes to follow up yet",
    reviewTrackEmptyNote: "Tell your AI: ‘Let’s try this and check for improvement in two weeks.’ Agree on which data to check.",
    decisionPlaybookTitle: "Personal decision playbook",
    decisionPlaybookNote: "Lessons you have confirmed, each linked to the project record it came from.",
    decisionCandidate: "Used in one project",
    decisionRepeated: "Repeated",
    decisionConflict: "Different accounts to review",
    decisionEvidence: "Evidence records",
    noDecisionPrinciples: "No lessons saved yet",
    noDecisionPrinciplesNote: "Tell your AI ‘Add this to my decision playbook’ when you find a useful lesson. Keep its original project record linked.",
    crossProjectCommand: "Collect lessons from several projects",
    visibility: "Visibility",
    profilePrivate: "For your eyes only",
    profileTeam: "Team copy",
    profilePublic: "Redacted public view",
    profilePrivateNote: "Full content stays in the local project",
    profileTeamNote: "Team/public records only; sharing still requires access control",
    profilePublicNote: "Public records only; original words, internal process, and paths were removed at generation time",
    density: "Density",
    comfortable: "Roomy",
    compact: "Compact",
    loading: "Opening project records…",
    sourceError: "Project record could not be loaded",
    sourceHelp: "Run buildtrace serve --target . in your project folder and open the address it prints. Records should be in docs/buildtrace/BUILDTRACE.md.",
    boardEyebrow: "PROJECT NOTES",
    boardTitle: "Remember why,\nnot only what changed.",
    boardNote: "Return to the original words, decisions, and work, and see what happened afterwards.",
    openSource: "Open record file",
    totalRecords: "All records",
    pendingReview: "Waiting for outcome",
    effective: "Effective",
    nextReview: "Next outcome check",
    milestones: "Key moments",
    dueOutcomes: "Outcome due",
    latestRecord: "Latest record",
    noReview: "None",
    search: "Search records, quotes, or sources",
    all: "All",
    pending: "Waiting for outcome",
    valid: "Effective",
    uncertain: "No conclusion",
    ineffective: "Did not hold",
    noResults: "No matching records",
    noResultsHint: "Try another phrase or clear the current filter.",
    noPublishedRecords: "This shared board has no records yet",
    noPublishedRecordsHint: "Ask your AI to mark the records you want to share as team or public, then generate the board again.",
    backToRecords: "Back to records",
    sourceTrust: "Source trust",
    evidence: "Evidence",
    scene: "Category",
    resultStatus: "Later outcome",
    reviewDate: "Review date",
    quote: "Original words",
    summary: "What you asked for",
    why: "Why",
    changes: "What changed",
    technical: "Technical notes",
    result: "Result",
    copyCorrection: "Correct this record",
    copyReview: "Add the later outcome",
    actionHelp: "Copy a message, paste it to the AI you use, and add your explanation.",
    copied: "Copied. Paste it to your AI.",
    copyFallback: "Clipboard access was not granted. Copy the text below manually:",
    copyPrepared: "Send the text below to your AI. Select and copy it if automatic copying did not work.",
    closeCopyPanel: "Close copy panel",
    tutorialEyebrow: "GETTING STARTED",
    tutorialTitle: "Using BuildTrace for the first time",
    tutorialNote: "Install once, then work with your AI as usual. Learn how to start, find your records, and add later results.",
    progress: "Tutorial progress",
    markComplete: "Mark complete",
    completed: "Completed",
    previous: "Previous",
    next: "Next",
    openBoard: "Open board",
    copy: "Copy",
    workbench: "Project workbench",
    workbenchNote: "Look at recent progress, then open a record to read more.",
    projectResources: "Project resources",
    resourceVault: "Project resources",
    resourceVaultNote: "Keep useful documents, analytics, designs, and websites close by when reviewing the project.",
    addResource: "Add project resource",
    manageResources: "Organize resources",
    resourceBuilderTitle: "Add a project resource",
    resourceBuilderNote: "Fill this in, then send the copied text to your AI to save. The web page does not add resources directly.",
    resourceTitle: "Name",
    resourceURL: "URL or project-relative path",
    resourceCategory: "Category",
    resourceNote: "When to use it / why it matters",
    copyResourceCommand: "Copy for your AI",
    readonlyReminder: "Wait for your AI to confirm it is saved, then refresh this page.",
    workflows: "How records are saved",
    sourceCoverage: "Sources used in these records",
    timelineOverview: "Key moments",
    timelineNote: "Major releases, features, architecture changes, and confirmed milestones only",
    noMilestones: "No key moments are marked yet. Regular changes remain available in the full record list.",
    records: "Project records",
    allScenes: "All categories",
    restoreContext: "Review previous work",
    restoreContextNote: "Read relevant records before work",
    recordSession: "Save this work",
    recordSessionNote: "Keep quotes, changes, and test results",
    reviewDue: "Add later results",
    reviewDueNote: "Bring new data and feedback back",
    fillGaps: "Check for missing details",
    fillGapsNote: "Find gaps that make the work hard to understand",
    noResources: "No project resources recorded",
    evidenceMissing: "No evidence recorded",
    causalChain: "Record detail",
    originalWords: "Original words",
    showAllQuotes: "Expand every original message",
    agentUnderstanding: "How the AI understood it",
    agentPlan: "How the AI planned to work",
    executionTrace: "Steps actually taken",
    technicalNotes: "Implementation and verification",
    evidenceSource: "Evidence / source",
    resultReview: "Outcome review",
    copyEvidence: "Add evidence",
    projectContext: "Project and resources",
    projectContextNote: "Project name, filters, and recording",
    recordKind: "Work type",
    recordTags: "Record tags",
    relatedRecords: "Related records",
    relatedRecordsNote: "Records with the same work type",
    automationDetails: "Ask your AI to review or add records",
    heroTitle: "Don't let your thinking get buried in AI chats",
    heroNote: "Keep why you made a change and what you did. Come back later to check progress and results.",
    humanPurpose: "A note from the maker",
    humanPurposeExpand: "Keep reading",
    sourceMode: "Records are saved in your project files",
    downloadSource: "Download records",
    newRecordDraft: "Ask AI to save this work",
    deploymentTitle: "Deploy your own board and view it on mobile",
    deploymentNote: "Publish the board at a fixed address to view it on another device. Online content updates when you publish again.",
    deploymentStatus: "Static-first",
    deploymentGuide: "View deployment steps",
    projectTools: "Project tools",
    openResources: "Project resources",
    shareDeploy: "Share / deploy",
    deploymentDrawerTitle: "View on another device or share",
    deploymentDrawerNote: "A local address only works on this computer. Publish a team or public copy for other devices; team hosting needs sign-in protection.",
    privacyFirst: "Check privacy before publishing",
    privacyNote: "Records may contain private conversations and internal resources. Use the commands below to create a sharing copy, review it, then publish it.",
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
    "zh": {
      "title": "安装一次",
      "subtitle": "让常用 AI 工具读到规则",
      "lead": "需要 Node.js 20 或更高版本。在终端运行下面的命令，然后重新打开 AI 工具或开始新会话。",
      "points": [
        "安装包含通用规则，不携带作者的项目记录。",
        "以后进入可写项目，已配置的 AI 会按规则检查并启用 BuildTrace。",
        "其他工具如果会读取项目的 AGENTS.md，也能使用其中的记录规则；具体是否执行要看工具。"
      ],
      "command": "npm install -g git+https://github.com/yimleunggggg/Buildtrace.git && buildtrace setup"
    },
    "en": {
      "title": "Install once",
      "subtitle": "Give your AI tools the recording rules",
      "lead": "Requires Node.js 20 or later. Run the command below, then reopen your AI tool or start a new session.",
      "points": [
        "The install contains rules, not the author's project records.",
        "In writable projects, configured AI tools follow the rules to check and initialize BuildTrace.",
        "Other tools that read a project's AGENTS.md can also use its rules. Execution depends on the tool."
      ],
      "command": "npm install -g git+https://github.com/yimleunggggg/Buildtrace.git && buildtrace setup"
    }
  },
  {
    "zh": {
      "title": "在项目里开始",
      "subtitle": "照常说你想做什么",
      "lead": "第一次可以把下面这段话发给 AI。已有项目会先查找可读取的历史，新项目从这次工作开始记录。",
      "points": [
        "说清为什么做，以及你在意的取舍。",
        "重要功能、修复、运营动作或决定值得记录，小修边可以并在一起。",
        "找不到的旧原话应标明缺失；请 AI 分清已经读过的历史和只找到线索的历史。"
      ],
      "command": "为这个项目启用 BuildTrace。先找回能读取的历史，再继续工作。完成后请保存本轮记录，告诉我记录标题、ID 和文件位置，并打开看板。"
    },
    "en": {
      "title": "Start in a project",
      "subtitle": "Describe your work as usual",
      "lead": "Send the message below to your AI the first time. Existing projects can look for accessible history; new projects start with today's work.",
      "points": [
        "Explain why you want a change and which tradeoffs matter.",
        "Save important features, fixes, operations, and decisions. Keep small follow-ups together.",
        "Missing original messages should be marked as missing. Ask which history was actually read and which was only found."
      ],
      "command": "Enable BuildTrace for this project. Restore accessible history, then continue the work. Save this session's record when finished, show its title, ID and file location, and open the board."
    }
  },
  {
    "zh": {
      "title": "确认真的记下了",
      "subtitle": "看记录，而不只看“已启用”",
      "lead": "AI 完成工作后应给出记录标题、ID 和文件位置。你可以直接查看文件，或在项目文件夹运行下面的命令。",
      "points": [
        "status 显示项目有没有档案、记录数量和最新标题，不能证明所有对话都完整记录。",
        "serve 打印看板地址；在浏览器打开，查看这次原话和实际步骤。",
        "本地服务运行时，保存记录后看板会自动刷新。终端关闭或电脑离线后，本地地址可能无法使用。"
      ],
      "command": "buildtrace status --target .\nbuildtrace serve --target ."
    },
    "en": {
      "title": "Check the work was saved",
      "subtitle": "Look for a record, not just an enabled message",
      "lead": "Your AI should show the saved title, ID and file path. Open the file or run these commands in your project folder.",
      "points": [
        "status shows the archive, record count and latest title. It does not prove every conversation was fully captured.",
        "serve prints the board address. Open it to check your words and the steps taken.",
        "The local board refreshes when records are saved. Its address may stop working when the terminal closes or the computer goes offline."
      ],
      "command": "buildtrace status --target .\nbuildtrace serve --target ."
    }
  },
  {
    "zh": {
      "title": "过段时间再回来",
      "subtitle": "补结果，也能换工具继续",
      "lead": "有了新数据或反馈，直接告诉 AI 对应哪件事。换工具时，也可以请它先读项目记录再继续。",
      "points": [
        "比如：“两周过去了，点击率没变化，把这个结果补回去。”",
        "原来的判断应保留，后来修正要写明时间和新依据。",
        "想查漏写就说：“检查本轮哪些重要内容还没保存”，并要求给出实际记录位置。"
      ],
      "command": "先读 BuildTrace，告诉我这个项目最近做了什么、为什么这么做，还有什么没完成，再继续。"
    },
    "en": {
      "title": "Come back later",
      "subtitle": "Add results or continue in another tool",
      "lead": "When you have new data or feedback, tell your AI which work it relates to. In a new tool, ask it to read the records before continuing.",
      "points": [
        "For example: ‘It has been two weeks and clicks have not changed. Add that outcome.’",
        "Keep the earlier judgment and date any later correction with its new evidence.",
        "To check for missed records, ask which important parts of this session are not saved and request their actual file locations."
      ],
      "command": "Read BuildTrace first. Tell me what this project recently did, why, and what remains unfinished, then continue."
    }
  }
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
  sourceText: "",
  sourceStatus: "live",
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

function isDueEntry(entry, now = new Date()) {
  if (entry.status !== "待观察" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.reviewDate)) return false;
  const due = new Date(`${entry.reviewDate}T00:00:00`);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return due <= today;
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
    "portfolio-information-architecture": ["作品集结构", "Portfolio structure"],
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
  const timelineEntries = state.trace.entries.filter((entry) => entry.milestone);
  const scenes = [...new Set(state.trace.entries.flatMap((entry) => entry.scenes || [entry.scene]).filter(Boolean))];
  const query = state.query.trim().toLowerCase();
  const visibleEntries = state.trace.entries.filter((entry) => {
    const matchesStatus =
      state.status === "all" ||
      (state.status === "milestone" && entry.milestone) ||
      (state.status === "due" && isDueEntry(entry)) ||
      (state.status === "pending" && entry.status === "待观察") ||
      (state.status === "effective" && entry.status === "有效") ||
      (state.status === "uncertain" && entry.status === "不确定") ||
      (state.status === "ineffective" && entry.status === "无效");
    const matchesScene = state.scene === "all" || (entry.scenes || [entry.scene]).includes(state.scene);
    const haystack = [
      entry.title,
      entry.evidence,
      ...(entry.scenes || [entry.scene]),
      ...(entry.scenes || [entry.scene]).map(sceneLabel),
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
  const evidenceTokens = getEvidenceTokens(state.trace.entries);
  const isPrivateSource = (state.trace.publication?.profile || "private") === "private";
  const latestEntry = state.trace.entries.reduce((latest, entry) => {
    if (!latest) return entry;
    return entry.date.slice(0, 10) > latest.date.slice(0, 10) ? entry : latest;
  }, null);

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
            ${renderSideFilter("milestone", t("milestones"), timelineEntries.length)}
            ${renderSideFilter("due", t("dueOutcomes"), stats.due)}
          </div>
        </section>
        ${isPrivateSource ? `<section class="side-section side-automation">
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
            <p class="eyebrow">${escapeHTML(state.trace.title)} / ${t("boardEyebrow")}</p>
            <h1>${t("heroTitle")}</h1>
            <p>${t("heroNote")}</p>
          </div>
          <div class="trace-hero-actions">
            <div class="source-state">
              <span class="source-refresh" data-source-status="${escapeHTML(state.sourceStatus)}"><i aria-hidden="true"></i><span>${t(state.sourceStatus === "offline" ? "sourceUnavailable" : "liveRefresh")}</span></span>
            </div>
            <div>
              <a class="source-link" href="../BUILDTRACE.md" target="_blank" rel="noreferrer">${t("openSource")}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg></a>
              <a class="hero-action" href="../BUILDTRACE.md?download=1" download="BUILDTRACE.md">${t("downloadSource")}</a>
              ${isPrivateSource ? `<button class="hero-action is-primary" type="button" data-copy-command="${state.locale === "zh" ? "请按 BuildTrace 记录这次值得保留的工作，保存完整相关原话、实际步骤和验证结果；小修边并入已有记录。保存后检查文件，告诉我记录标题、ID 和位置。缺失的信息请注明，不要补编。" : "New record draft: first check whether this work deserves a separate record. Create one only for a feature, fix, design change, architecture change, release, operating action, or decision that will matter in a future review; merge small follow-up polish into the nearest related record. Use original words, actual file changes, and verification evidence. Mark uncertainty as unknown and do not invent facts."}">${t("newRecordDraft")}</button>` : ""}
            </div>
          </div>
        </header>
        <section class="workbench-signals" aria-label="${t("projectSignals")}">
          ${renderSignal("01", t("totalRecords"), stats.total)}
          ${renderSignal("02", t("milestones"), timelineEntries.length)}
          ${renderSignal("03", t("dueOutcomes"), stats.due, stats.due > 0)}
          ${renderSignal("04", t("latestRecord"), latestEntry ? formatSignalDate(latestEntry.date.slice(0, 10)) : t("noReview"))}
        </section>
        ${renderLensNavigation()}
        ${renderReviewTracks(state.trace.entries, state.lens !== "review")}
        ${renderDecisionPlaybook(state.trace.decisionPrinciples, state.lens !== "playbook")}
        <section class="timeline-panel" aria-label="${t("timelineOverview")}" ${state.lens !== "trace" ? "hidden" : ""}>
          <div class="panel-heading"><div><strong>${t("timelineOverview")}</strong><small>${t("timelineNote")}</small></div><span>${timelineEntries.length}</span></div>
          ${timelineEntries.length ? `<div class="timeline-track">
            ${[...timelineEntries].reverse().map((entry) => `<button type="button" data-entry-id="${escapeHTML(entry.id)}" data-entry-context="timeline" aria-current="${entry.id === state.selectedEntryId}"><span>${escapeHTML(entry.date)}</span><strong>${escapeHTML(entry.title)}</strong><small>${escapeHTML((entry.scenes || [entry.scene]).map(sceneLabel).join(" · "))}</small></button>`).join("")}
          </div>` : `<p class="timeline-empty">${t("noMilestones")}</p>`}
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
          <div class="mobile-status-filters" aria-label="${t("statusFilter")}">${renderFilter("all", t("all"))}${renderFilter("milestone", t("milestones"))}${renderFilter("due", t("dueOutcomes"))}</div>
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
  const isPrivateSource = profile === "private";
  const lenses = [
    ["trace", "01", t("traceLens"), t("traceLensNote")],
    ["review", "02", t("reviewLens"), t("reviewLensNote")],
    ["playbook", "03", t("playbookLens"), t("playbookLensNote")],
  ];
  return `<section class="lens-console" aria-label="${t("workbench")}">
    <nav class="lens-nav">${lenses.map(([value, index, label, note]) => `<button type="button" data-lens="${value}" aria-pressed="${state.lens === value}"><span>${index}</span><strong>${escapeHTML(label)}</strong><small>${escapeHTML(note)}</small></button>`).join("")}</nav>
    <div class="lens-meta">
      ${isPrivateSource ? `<div class="project-utilities" aria-label="${t("projectTools")}">
        <button type="button" data-action="open-resource-library"><span>${t("openResources")}</span><strong>${state.trace.resources.length}</strong></button>
        <button type="button" data-action="open-deploy-guide"><span>${t("shareDeploy")}</span><strong>↗</strong></button>
      </div>` : ""}
    </div>
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
  const countLabel = state.locale === "zh" ? `${items.length} 条` : `${items.length} item${items.length === 1 ? "" : "s"}`;
  const preview = items[0] || t("noStructuredValue");
  return `<div class="review-stage ${items.length ? "" : "is-empty"}">
    <span class="review-stage-index">${index}</span>
    <div>
      <div class="review-stage-heading"><strong>${escapeHTML(label)}</strong>${items.length ? `<small>${escapeHTML(countLabel)}</small>` : ""}</div>
      <p class="review-stage-preview">${escapeHTML(preview)}</p>
    </div>
  </div>`;
}

function renderReviewTracks(entries, hidden = false) {
  const tracks = entries.filter((entry) => entry.hypotheses?.length || entry.watchPlans?.length || entry.dataChanges?.length || entry.outcomes?.length);
  const content = tracks.length ? `<div class="review-track-list">${tracks.map((entry) => {
    const actions = entry.sectionItems?.changes?.length ? entry.sectionItems.changes : (entry.sections.changes ? [entry.sections.changes] : []);
    const evidence = [...(entry.dataChanges || []), ...(entry.watchPlans || [])];
    const judgments = entry.outcomes?.length ? entry.outcomes : (entry.sections.result ? [entry.sections.result] : []);
    return `<article class="review-track-card">
      <button class="review-track-head" type="button" data-entry-id="${escapeHTML(entry.id)}">
        <span class="review-track-date">${escapeHTML(entry.date)}</span>
        <span class="review-track-title"><strong>${escapeHTML(entry.title)}</strong><small>${escapeHTML(statusLabel(entry.status))}</small></span>
        <span class="review-track-open">${t("reviewOpen")} <b aria-hidden="true">↗</b></span>
      </button>
      <div class="review-track-grid">
        ${renderReviewStage("01", t("reviewHypothesis"), entry.hypotheses || [])}
        ${renderReviewStage("02", t("reviewAction"), actions)}
        ${renderReviewStage("03", t("reviewEvidence"), evidence)}
        ${renderReviewStage("04", t("reviewJudgment"), judgments)}
      </div>
    </article>`;
  }).join("")}</div>` : `<div class="lens-empty"><strong>${t("reviewTrackEmpty")}</strong><p>${t("reviewTrackEmptyNote")}</p><button type="button" data-copy-command="${state.locale === "zh" ? "请记下这次为什么这样做、期待什么变化，并和我约好什么时候看哪些数据。保存原话与实际动作，没有的数据注明缺失。" : "Record a review track: keep my original hypothesis, actual action, metric, source, baseline, target, and observation window. Do not invent missing data."}">${t("newRecordDraft")}</button></div>`;
  return `<section class="lens-workspace review-workspace" ${hidden ? "hidden" : ""}><header><h2>${t("reviewTrackTitle")}</h2><p>${t("reviewTrackNote")}</p></header>${content}</section>`;
}

function isConfirmedDecisionPrinciple(principle, sourceTrust = principle.sourceTrust, evidence = principle.evidence) {
  return ["user-confirmed", "human-confirmed"].includes(String(principle.confirmation || "").toLowerCase())
    && sourceTrust === "confirmed"
    && String(evidence || "").trim();
}

function renderDecisionPlaybook(principles = [], hidden = false) {
  const groups = new Map();
  for (const principle of principles.filter((item) => isConfirmedDecisionPrinciple(item))) {
    if (!groups.has(principle.id)) groups.set(principle.id, []);
    groups.get(principle.id).push(principle);
  }
  const cards = [...groups.entries()].map(([id, evidence]) => {
    const variants = [...new Set(evidence.map((item) => `${item.category}\u0000${item.text}`))];
    const status = variants.length > 1 ? "conflict" : evidence.length > 1 ? "repeated" : "candidate";
    const label = t(status === "conflict" ? "decisionConflict" : status === "repeated" ? "decisionRepeated" : "decisionCandidate");
    return `<article class="principle-card" data-status="${status}"><div class="principle-kicker"><span>${escapeHTML(label)}</span></div><h3>${escapeHTML(evidence[0].text)}</h3><p>${escapeHTML(evidence[0].category)}</p><details><summary>${t("decisionEvidence")} · ${evidence.length}</summary><code class="principle-reference">${escapeHTML(id)}</code><ul>${evidence.map((item) => `<li><button type="button" data-entry-id="${escapeHTML(item.recordId)}"><span>${escapeHTML(item.recordDate)}</span>${escapeHTML(item.recordTitle)}</button></li>`).join("")}</ul></details>${variants.length > 1 ? `<div class="principle-conflict">${variants.map((variant) => `<p>${escapeHTML(variant.split("\u0000")[1])}</p>`).join("")}</div>` : ""}</article>`;
  });
  const command = state.locale === "zh" ? "请把我指定的几个项目中，已由我确认的经验汇总成决策手册。先列出可以读取的项目供我选择；每条保留来源，不合并相互矛盾的说法。" : "Collect my confirmed lessons from the projects I choose into a decision playbook. List accessible projects first so I can select them. Keep sources linked and retain conflicting accounts.";
  const content = cards.length ? `<div class="principle-grid">${cards.join("")}</div>` : `<div class="lens-empty"><strong>${t("noDecisionPrinciples")}</strong><p>${t("noDecisionPrinciplesNote")}</p></div>`;
  return `<section class="lens-workspace playbook-workspace" ${hidden ? "hidden" : ""}><header class="playbook-head"><div><h2>${t("decisionPlaybookTitle")}</h2><p>${t("decisionPlaybookNote")}</p></div><button type="button" data-copy-command="${escapeHTML(command)}">${t("crossProjectCommand")}</button></header>${content}</section>`;
}

function renderHumanPurpose(purpose) {
  if (!purpose) return "";
  const paragraphs = purpose.split(/\n+/).filter(Boolean);
  const lead = paragraphs[0];
  const remainder = paragraphs.slice(1);
  return `<details class="human-purpose"><summary><span>${t("humanPurpose")}</span><strong>${escapeHTML(lead)}</strong>${remainder.length ? `<b>${t("humanPurposeExpand")} +</b>` : ""}</summary>${remainder.length ? `<div>${remainder.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("")}</div>` : ""}</details>`;
}

function getResourceHref(resource) {
  try {
    const buildtraceBase = new URL("../", window.location.href);
    const projectBase = new URL("../../../", window.location.href);
    const value = resource.url.replace(/^`|`$/g, "");
    if (/^(?:file:|\/Users\/|\/home\/|[A-Za-z]:\\)/i.test(value)) return null;
    const resolved = new URL(value, value.startsWith("docs/") ? projectBase : buildtraceBase);
    return ["http:", "https:"].includes(resolved.protocol) ? resolved.href : null;
  } catch {
    return null;
  }
}

function renderUtilityPanel() {
  if (!state.utilityPanel) return "";
  const body = state.utilityPanel === "resource"
    ? renderResourceManager()
    : state.utilityPanel === "about"
      ? renderAboutPanel()
      : renderDeployGuide();
  const label = state.utilityPanel === "resource"
    ? t("resourceVault")
    : state.utilityPanel === "about"
      ? t("aboutTitle")
      : t("deploymentDrawerTitle");
  return `<div class="utility-backdrop"><section class="utility-drawer" role="dialog" aria-modal="true" aria-label="${escapeHTML(label)}" data-utility-drawer><button class="utility-close" type="button" data-action="close-utility" aria-label="${t("close")}">×</button>${body}</section></div>`;
}

function renderAboutPanel() {
  const paragraphs = (state.trace.humanPurpose || "").split(/\n+/).map((item) => item.trim()).filter(Boolean);
  return `<div class="utility-heading"><h2>${t("aboutTitle")}</h2><p>${t("aboutNote")}</p><button type="button" class="utility-primary" data-mode="tutorial">${t("tutorialTitle")}</button></div>
    <section class="about-live-card">
      <span><i aria-hidden="true"></i>${t("liveRefresh")}</span>
      <strong>${t("liveRefreshLocal")}</strong>
      <p>${t("liveRefreshNote")}</p>
    </section>
    ${paragraphs.length ? `<section class="about-maker"><h3>${t("aboutMaker")}</h3>${paragraphs.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("")}</section>` : ""}`;
}

function renderResourceManager() {
  const resources = state.trace.resources;
  const cards = resources.length
    ? resources.map((resource) => {
      const href = getResourceHref(resource);
      return `<a class="utility-resource" href="${escapeHTML(href || "#")}" ${href ? 'target="_blank" rel="noreferrer"' : 'aria-disabled="true"'}><span data-resource-kind="${escapeHTML(resource.category)}">${escapeHTML(resource.label.slice(0, 1))}</span><div><strong>${escapeHTML(resource.title)}</strong><small>${escapeHTML(resourceCategoryLabel(resource.category))}</small><p>${escapeHTML(resource.note || resource.url)}</p></div><b>${href ? "↗" : "—"}</b></a>`;
    }).join("")
    : `<p class="resource-vault-empty">${t("noResources")}</p>`;
  return `<div class="utility-heading"><h2>${t("resourceVault")}</h2><p>${t("resourceVaultNote")}</p></div><div class="utility-resource-list">${cards}</div><details class="resource-add"><summary>${t("addResource")} <span>+</span></summary>${renderResourceBuilder(false)}</details>`;
}

function renderResourceBuilder(showHeading = true) {
  const categories = ["code", "docs", "reference", "data", "deploy", "finance", "admin", "design", "community", "other"];
  return `${showHeading ? `<div class="utility-heading"><h2>${t("resourceBuilderTitle")}</h2><p>${t("resourceBuilderNote")}</p></div>` : `<p class="resource-builder-note">${t("resourceBuilderNote")}</p>`}<form class="resource-builder" id="resource-builder"><label><span>${t("resourceTitle")}</span><input name="title" required autocomplete="off" placeholder="${state.locale === "zh" ? "例如：PostHog 产品数据" : "e.g. PostHog product analytics"}" /></label><label><span>${t("resourceURL")}</span><input name="url" required autocomplete="off" placeholder="https://… / ./docs/…" /></label><label><span>${t("resourceCategory")}</span><select name="category">${categories.map((category) => `<option value="${category}">${escapeHTML(resourceCategoryLabel(category))}</option>`).join("")}</select></label><label><span>${t("resourceNote")}</span><textarea name="note" rows="3" placeholder="${state.locale === "zh" ? "例如：复盘自然搜索与关键行为时查看" : "e.g. Use when reviewing organic search and key behavior"}"></textarea></label><p class="readonly-note">${t("readonlyReminder")}</p><button class="utility-primary" type="submit">${t("copyResourceCommand")}</button></form>`;
}

function renderDeployGuide() {
  const localCommand = "node docs/buildtrace/viewer/serve.mjs";
  const teamCommand = "node bin/buildtrace.mjs publish --profile team --target . --output .buildtrace/team-site";
  const publicCommand = "node bin/buildtrace.mjs publish --profile public --target . --output .buildtrace/public-site";
  const githubCommand = "node bin/buildtrace.mjs deploy-kit --provider github-pages --target .";
  const teamNote = state.locale === "zh" ? "生成团队版副本，移除不分享的记录和内部路径。请发布到需要登录才能访问的地方。" : "Generate a team snapshot without private records and internal paths; add access control when hosting.";
  const publicNote = state.locale === "zh" ? "只分享你指定为公开的记录，自动移除聊天原话、AI 工作过程和内部路径。发布前请检查生成的文件。" : "Publish only explicitly public records; original words, Agent process, and technical paths are removed at generation time.";
  return `<div class="utility-heading"><h2>${t("deploymentDrawerTitle")}</h2><p>${t("deploymentDrawerNote")}</p></div><div class="privacy-warning"><strong>${t("privacyFirst")}</strong><p>${t("privacyNote")}</p></div><div class="deploy-options">${renderDeployOption(t("localPrivate"), t("localPrivateNote"), localCommand, "01")}${renderDeployOption(t("profileTeam"), teamNote, teamCommand, "02")}${renderDeployOption(t("profilePublic"), publicNote, publicCommand, "03")}${renderDeployOption("GitHub Pages", t("deploymentGithubNote"), githubCommand, "04")}</div><a class="deploy-doc-link" href="../DEPLOY.md" target="_blank" rel="noreferrer">${t("openDeployDoc")} ↗</a>`;
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

function hasRecordedOutcome(entry) {
  return ["有效", "无效"].includes(entry.status);
}

function recordPreview(entry) {
  const first = (entry.sectionItems?.summary?.[0] || entry.sections.why || entry.sections.changes || "").trim();
  return first.replace(/^\[[A-Z]\d+\s*<-[^\]]+]\s*/, "");
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
                  ${recordPreview(entry) ? `<span class="record-summary">${escapeHTML(recordPreview(entry))}</span>` : ""}
                  <span class="record-tags" aria-label="${t("recordTags")}">
                    ${(entry.scenes || [entry.scene]).slice(0, 3).map((scene) => renderRecordTag(sceneLabel(scene), "scene")).join("")}
                  </span>
                </span>
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
  const confirmedDecisionPrinciples = (entry.decisionPrinciples || [])
    .filter((principle) => isConfirmedDecisionPrinciple(principle, entry.sourceTrust, entry.evidence));
  return `
    <article class="detail-article">
      <p class="detail-overline">${t("recordTags")}</p>
      <div class="detail-kicker" aria-label="${t("recordTags")}">
        ${(entry.scenes || [entry.scene]).map((scene, index) => renderRecordTag(sceneLabel(scene), "scene", index === 0 ? t("recordKind") : "")).join("")}
        ${hasRecordedOutcome(entry) ? renderRecordTag(statusLabel(entry.status), `status-${entry.status}`, t("resultStatus")) : ""}
        ${renderRecordTag(trustLabel(entry.sourceTrust), `trust-${entry.sourceTrust}`, t("sourceTrust"))}
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
      ${(entry.hypotheses?.length || entry.watchPlans?.length || entry.dataChanges?.length || entry.outcomes?.length || confirmedDecisionPrinciples.length) ? `<div class="structured-review-detail">
        ${renderStructuredSection(t("reviewHypothesis"), entry.hypotheses, "hypothesis")}
        ${renderStructuredSection(t("reviewEvidence"), [...(entry.watchPlans || []), ...(entry.dataChanges || [])], "evidence")}
        ${renderStructuredSection(t("reviewJudgment"), entry.outcomes, "judgment")}
        ${renderStructuredSection(t("decisionPlaybookTitle"), confirmedDecisionPrinciples, "principle")}
      </div>` : ""}
      ${renderItemSection(t("executionTrace"), entry.sectionItems?.executionTrace, entry.sections.executionTrace, "execution-trace-card")}
      ${entry.sections.technical ? `<section class="technical-card"><h3>${t("technicalNotes")}</h3><p>${escapeHTML(entry.sections.technical)}</p></section>` : ""}
      ${relatedEntries.length ? `<section class="related-section"><div class="related-heading"><div><h3>${t("relatedRecords")}</h3><p>${t("relatedRecordsNote")} · ${escapeHTML(sceneLabel(entry.scene))}</p></div><span>${relatedEntries.length}</span></div><div class="related-list">${relatedEntries.map((related) => `<button type="button" data-entry-id="${escapeHTML(related.id)}" data-entry-context="related"><span>${escapeHTML(related.date.slice(5).replace("-", "."))}</span><strong>${escapeHTML(related.title)}</strong><small>${escapeHTML(statusLabel(related.status))}</small></button>`).join("")}</div></section>` : ""}
      <div class="detail-actions">
        <p>${t("actionHelp")}</p>
        <button class="action-button is-primary" type="button" data-copy-command="${state.locale === "zh" ? `纠正记录「${escapeHTML(entry.title)}」：先保存快照，再根据我接下来的说明追加修正时间、事实和新依据。保留已有原话与当时的判断，保存后检查历史并给我记录位置。` : `Correct the record &quot;${escapeHTML(entry.title)}&quot;: snapshot it first, then append a dated correction and new evidence using my next message. Preserve existing words and judgments, verify history, and show the saved location.`}">${t("copyCorrection")}</button>
        <button class="action-button" type="button" data-copy-command="${state.locale === "zh" ? `补记「${escapeHTML(entry.title)}」的后来结果：请根据我提供的数据或反馈，更新数据变化、结果判断、依据与后续回看；不要把相关性写成确定因果。` : `Add the later outcome for &quot;${escapeHTML(entry.title)}&quot; using the data or feedback I provide. Update data change, judgment, evidence, and next review without turning correlation into proven causation.`}">${t("copyReview")}</button>
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
        <small>${escapeHTML(quoteFidelityLabel(quote.fidelity))}</small>
        <p>${escapeHTML(quote.text || "—")}</p>
        ${quote.sourceRef ? `<details class="trace-reference"><summary>${state.locale === "zh" ? "查看来源" : "View source"}</summary><code>${escapeHTML([quote.id, quote.speaker, quote.sourceRef, quote.fidelity].filter(Boolean).join(" · "))}</code></details>` : ""}
      </article>`).join("")}
    </div>
  </details>`;
}

function renderItemSection(label, items, fallback, className) {
  const values = items?.length ? items : (fallback ? [fallback] : []);
  if (!values.length) return "";
  const references = [];
  const list = values.map((item, index) => {
    const match = item.match(/^\[((?:R|U|P|E)\d+\b[^\]]*)]\s*([\s\S]*)$/);
    if (!match) return `<li>${escapeHTML(item)}</li>`;
    references.push(`${index + 1}. ${match[1]}`);
    return `<li>${escapeHTML(match[2])}</li>`;
  }).join("");
  const sources = references.length ? `<details class="trace-reference"><summary>${state.locale === "zh" ? "查看来源对应" : "View source references"}</summary><code>${escapeHTML(references.join("\n"))}</code></details>` : "";
  return `<section class="${className}"><span>${escapeHTML(label)}</span><ul>${list}</ul>${sources}</section>`;
}

function quoteFidelityLabel(fidelity) {
  const labels = {
    verbatim: ["原话记录", "Original message"],
    "compacted-summary": ["会话摘要，原话未取得", "Session summary; original unavailable"],
    "artifact-evidence": ["来自文件或附件", "From a file or attachment"],
    "attachment-only": ["仅有附件", "Attachment only"],
    unavailable: ["未取得原话", "Original unavailable"],
  };
  return labels[fidelity]?.[state.locale === "zh" ? 0 : 1] || (state.locale === "zh" ? "来源尚未核对" : "Source not checked yet");
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
      ${renderUtilityPanel()}
    </section>
  `;
}

function setMode(mode) {
  if (!['board', 'tutorial'].includes(mode)) return;
  state.mode = mode;
  state.detailOpen = false;
  state.utilityPanel = null;
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

function showCopyPanel(value) {
  document.querySelector(".copy-fallback-panel")?.remove();
  const panel = document.createElement("aside");
  panel.className = "copy-fallback-panel";
  panel.setAttribute("role", "status");

  const heading = document.createElement("strong");
  heading.textContent = t("copyPrepared");
  const textarea = document.createElement("textarea");
  textarea.readOnly = true;
  textarea.rows = Math.min(8, Math.max(3, value.split("\n").length));
  textarea.value = value;
  const close = document.createElement("button");
  close.type = "button";
  close.dataset.action = "close-copy-panel";
  close.setAttribute("aria-label", t("closeCopyPanel"));
  close.textContent = "×";
  close.addEventListener("click", () => panel.remove());

  panel.append(heading, textarea, close);
  document.body.append(panel);
  textarea.focus();
  textarea.select();
}

async function copyText(value) {
  let copied = false;
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(value);
    copied = true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.focus();
    textarea.select();
    copied = Boolean(document.execCommand?.("copy"));
    textarea.remove();
  }
  showCopyPanel(value);
  showToast(copied ? t("copied") : t("copyFallback"));
  return copied;
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
  if (actionButton.dataset.action === "open-resource-library") {
    state.utilityPanel = "resource";
    render();
    requestAnimationFrame(() => document.querySelector(".utility-close")?.focus());
  }
  if (actionButton.dataset.action === "open-deploy-guide") {
    state.utilityPanel = "deploy";
    render();
    requestAnimationFrame(() => document.querySelector(".utility-close")?.focus());
  }
  if (actionButton.dataset.action === "open-about") {
    state.utilityPanel = "about";
    render();
    requestAnimationFrame(() => document.querySelector(".utility-close")?.focus());
  }
  if (actionButton.dataset.action === "close-utility") {
    state.utilityPanel = null;
    render();
  }
  if (actionButton.dataset.action === "close-copy-panel") {
    actionButton.closest(".copy-fallback-panel")?.remove();
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
    ? `把下面项目资料添加到本项目实际使用的 BuildTrace 记录文件的「项目入口 / 参考资料」中，遵循项目指定的文件路径。先保存快照；保留现有入口和项目记录，如果已有同名入口就更新它。保存后核验并告诉我文件位置。\n\n${resourceLine}`
    : `Add the project resource below to the “项目入口 / 参考资料” section of this project's BuildTrace archive, respecting any source-path override. Take a snapshot first. Keep existing resources and project records; update the existing item if the name already exists. Verify the saved file and report its location.\n\n${resourceLine}`;
  let output = event.target.querySelector(".resource-command-output");
  if (!output) {
    output = document.createElement("textarea");
    output.className = "resource-command-output";
    output.readOnly = true;
    output.rows = 6;
    event.target.append(output);
  }
  output.value = command;
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
    state.sourceText = await response.text();
    state.trace = parseBuildtrace(state.sourceText);
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

async function refreshTrace() {
  if (document.hidden || !state.trace || state.utilityPanel === "resource") return;
  try {
    const sourceURL = new URL("../BUILDTRACE.md", window.location.href);
    const response = await fetch(sourceURL, { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const nextSource = await response.text();
    state.sourceStatus = "live";
    if (nextSource === state.sourceText) {
      document.querySelector(".source-refresh")?.setAttribute("data-source-status", "live");
      return;
    }
    const nextTrace = parseBuildtrace(nextSource);
    if (!nextTrace.entries.length && nextTrace.publication?.profile === "private") return;
    state.sourceText = nextSource;
    state.trace = nextTrace;
    if (!nextTrace.entries.some((entry) => entry.id === state.selectedEntryId)) {
      state.selectedEntryId = nextTrace.entries[0]?.id ?? null;
      state.detailOpen = false;
    }
    render();
    showToast(t("sourceUpdated"));
  } catch {
    state.sourceStatus = "offline";
    const indicator = document.querySelector(".source-refresh");
    indicator?.setAttribute("data-source-status", "offline");
    const label = indicator?.querySelector("span");
    if (label) label.textContent = t("sourceUnavailable");
  }
}

window.setInterval(refreshTrace, 10000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshTrace();
});
