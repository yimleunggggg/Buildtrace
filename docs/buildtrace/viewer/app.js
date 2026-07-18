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
    density: "密度",
    comfortable: "舒展",
    compact: "紧凑",
    loading: "正在读取项目主源…",
    sourceError: "无法读取项目记录",
    sourceHelp: "请确认 BUILDTRACE.md 位于 docs/buildtrace/，并通过本地服务器打开 Viewer。",
    boardEyebrow: "PROJECT MEMORY / LIVE SOURCE",
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
    density: "Density",
    comfortable: "Roomy",
    compact: "Compact",
    loading: "Reading the project source…",
    sourceError: "Project record could not be loaded",
    sourceHelp: "Confirm BUILDTRACE.md is in docs/buildtrace/ and open the Viewer through the local server.",
    boardEyebrow: "PROJECT MEMORY / LIVE SOURCE",
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
      lead: "新一轮工作开始前，只恢复与当前任务有关的上下文。重点不是读完历史，而是找回现在的判断依据。",
      points: [
        "读取项目初心，避免功能偏离产品边界。",
        "读取最近 3–5 条记录，找到当前连续性。",
        "检查已经到期的待观察项，别让结果永远悬空。",
      ],
      command: "Restore context",
    },
    en: {
      title: "Restore context before work",
      subtitle: "Read intent, recent records, and due reviews",
      lead: "Before a meaningful work session, restore only the context that affects the current task. The goal is not to reread history; it is to recover the reasoning behind the next move.",
      points: [
        "Read the project intent so new features stay inside the product boundary.",
        "Read the latest 3–5 records to recover continuity.",
        "Check overdue pending outcomes so results do not stay unresolved forever.",
      ],
      command: "恢复上下文",
    },
  },
  {
    zh: {
      title: "完成后记录因果",
      subtitle: "只记录有意义的变化",
      lead: "一次功能、修复、设计或重要决策完成后，让 Agent 把人的动机和证据连到真实改动上。不要把每个 commit 重新抄一遍。",
      points: [
        "保留用户原话，同时单独写 Agent 的需求总结。",
        "写清为什么做、实际做了什么、依据在哪里。",
        "无法当场判断效果时，设为待观察并约定回看日期。",
      ],
      command: "Record this session",
    },
    en: {
      title: "Record causality after work",
      subtitle: "Capture only meaningful change",
      lead: "After a feature, fix, design change, or important decision, connect human intent and evidence to what really changed. BuildTrace is not a rewritten commit log.",
      points: [
        "Keep the user's original words and write the Agent summary separately.",
        "State why it happened, what actually changed, and where the evidence lives.",
        "If impact is not yet knowable, mark it pending and set a review date.",
      ],
      command: "记录本轮",
    },
  },
  {
    zh: {
      title: "回看结果并修正",
      subtitle: "让记录随着证据变准",
      lead: "项目记忆不是一次性归档。到期后检查真实结果；发现事实或判断变化时，直接修正记录并同步更新可信度。",
      points: [
        "用数据、截图、commit 或用户反馈完成结果回看。",
        "结论可以是有效、无效或不确定，不强迫成功叙事。",
        "修正时同步修改依据和来源可信度。",
      ],
      command: "Outcome effective / ineffective / uncertain",
    },
    en: {
      title: "Review outcomes and correct",
      subtitle: "Let evidence make the record more accurate",
      lead: "Project memory is not a one-time archive. Review real outcomes when they are due, and correct the record when facts or judgment change.",
      points: [
        "Use data, screenshots, commits, or user feedback to review the outcome.",
        "A result can be effective, ineffective, or uncertain. Do not force a success story.",
        "When correcting a record, update both its evidence and source trust.",
      ],
      command: "结果有效 / 无效 / 不确定",
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
  query: "",
  status: "all",
  selectedEntryId: null,
  detailOpen: false,
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
  const isolated = state.detailOpen && window.matchMedia("(max-width: 900px)").matches;
  for (const element of [document.querySelector(".topbar"), document.querySelector(".index-pane"), document.querySelector(".mobile-nav")]) {
    element?.toggleAttribute("inert", isolated);
  }
}

function renderBoard() {
  const stats = getBuildtraceStats(state.trace.entries);
  const query = state.query.trim().toLowerCase();
  const visibleEntries = state.trace.entries.filter((entry) => {
    const matchesStatus =
      state.status === "all" ||
      (state.status === "pending" && entry.status === "待观察") ||
      (state.status === "effective" && entry.status === "有效") ||
      (state.status === "uncertain" && entry.status === "不确定") ||
      (state.status === "ineffective" && entry.status === "无效");
    const haystack = [
      entry.title,
      entry.evidence,
      entry.scene,
      ...Object.values(entry.sections),
    ]
      .join(" ")
      .toLowerCase();
    return matchesStatus && (!query || haystack.includes(query));
  });

  if (!state.selectedEntryId || !visibleEntries.some((entry) => entry.id === state.selectedEntryId)) {
    state.selectedEntryId = visibleEntries[0]?.id ?? null;
  }
  const selected = state.trace.entries.find((entry) => entry.id === state.selectedEntryId);

  return `
    <section class="board-view">
      <header class="board-hero">
        <div>
          <p class="eyebrow">${t("boardEyebrow")}</p>
          <h1>${escapeHTML(t("boardTitle")).replace("\n", "<br>")}</h1>
        </div>
        <div class="hero-note">
          <p>${escapeHTML(t("boardNote"))}</p>
          <a class="source-link" href="../BUILDTRACE.md" target="_blank" rel="noreferrer">
            ${t("openSource")}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
          </a>
        </div>
      </header>

      <section class="signal-strip" aria-label="${t("projectSignals")}">
        ${renderSignal("01", t("totalRecords"), stats.total)}
        ${renderSignal("02", t("pendingReview"), stats.pending, stats.due > 0)}
        ${renderSignal("03", t("effective"), stats.effective)}
        ${renderSignal("04", t("nextReview"), stats.nextReview ? formatSignalDate(stats.nextReview) : t("noReview"))}
      </section>

      <section class="workspace">
        <aside class="index-pane" aria-label="${t("recordIndex")}">
          <div class="workspace-tools">
            <label class="search-field">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
              <span class="sr-only">${t("search")}</span>
              <input id="record-search" type="search" value="${escapeHTML(state.query)}" placeholder="${escapeHTML(t("search"))}" autocomplete="off" />
            </label>
            <div class="filter-row" aria-label="${t("statusFilter")}">
              ${renderFilter("all", t("all"))}
              ${renderFilter("pending", t("pending"))}
              ${renderFilter("effective", t("valid"))}
              ${renderFilter("uncertain", t("uncertain"))}
              ${renderFilter("ineffective", t("ineffective"))}
            </div>
          </div>
          <p class="sr-only" role="status">${resultCountLabel(visibleEntries.length)}</p>
          ${renderRecordList(visibleEntries)}
        </aside>
        <section class="detail-pane ${state.detailOpen ? "is-open" : ""}" aria-label="${t("selectedRecordDetail")}" tabindex="-1">
          <button class="detail-close" type="button" data-action="close-detail">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
            ${t("backToRecords")}
          </button>
          ${selected ? renderDetail(selected) : ""}
        </section>
      </section>
      <div class="toast" id="toast" hidden role="status"></div>
    </section>
  `;
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
    return `<div class="empty-list"><strong>${t("noResults")}</strong><span>${t("noResultsHint")}</span></div>`;
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
                  <span class="record-scene">${escapeHTML(entry.scene)} · ${escapeHTML(statusLabel(entry.status))}</span>
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
  const sections = [
    ["quote", "quote", true, true],
    ["summary", "summary", false, false],
    ["why", "why", false, false],
    ["changes", "changes", false, false],
    ["technical", "technical", false, false],
    ["result", "result", false, true],
  ];

  return `
    <article class="detail-article">
      <div class="detail-kicker">
        <span>${escapeHTML(formatDate(entry.date))}</span>
        <span>•</span>
        <span>${escapeHTML(entry.scene)}</span>
      </div>
      <h2>${escapeHTML(entry.title)}</h2>
      <dl class="metadata-band">
        ${renderMetadata(t("sourceTrust"), entry.sourceTrust)}
        ${renderMetadata(t("resultStatus"), statusLabel(entry.status))}
        ${renderMetadata(t("reviewDate"), entry.reviewDate === "无" ? t("noReview") : formatDate(entry.reviewDate))}
        ${renderMetadata(t("evidence"), entry.evidence)}
      </dl>
      <div class="narrative-grid">
        ${sections
          .filter(([key]) => entry.sections[key])
          .map(
            ([key, label, quote, wide]) => `
              <section class="narrative-section ${quote ? "quote-section" : ""} ${wide ? "is-wide" : ""}">
                <h3>${t(label)}</h3>
                <p>${escapeHTML(entry.sections[key])}</p>
              </section>
            `,
          )
          .join("")}
      </div>
      <div class="detail-actions">
        <button class="action-button is-primary" type="button" data-copy-command="修正「${escapeHTML(entry.title)}」">${t("copyCorrection")}</button>
        <button class="action-button" type="button" data-copy-command="结果有效 / 无效 / 不确定：${escapeHTML(entry.title)}">${t("copyReview")}</button>
      </div>
    </article>
  `;
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
          <div class="command-block">
            <code>${escapeHTML(step.command)}</code>
            <button class="command-copy" type="button" data-copy-command="${escapeHTML(step.command)}">${t("copy")}</button>
          </div>
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
  const modeButton = event.target.closest("[data-mode]");
  if (modeButton) {
    setMode(modeButton.dataset.mode);
    return;
  }

  const recordButton = event.target.closest("[data-entry-id]");
  if (recordButton) {
    state.selectedEntryId = recordButton.dataset.entryId;
    state.detailOpen = true;
    render();
    requestAnimationFrame(() => {
      const focusTarget = window.matchMedia("(max-width: 900px)").matches
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

window.addEventListener("keydown", (event) => {
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
    if (!state.trace.entries.length) throw new Error("BUILDTRACE.md contains no project records");
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
