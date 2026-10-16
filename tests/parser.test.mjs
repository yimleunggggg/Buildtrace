import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildRecordHandoff, getBuildtraceStats, parseBuildtrace, quoteKind, quoteRelevance } from "../docs/buildtrace/viewer/parser.js";
import { buildPublication } from "../docs/buildtrace/scripts/derive-views.mjs";

const source = await readFile(new URL("../docs/buildtrace/BUILDTRACE.md", import.meta.url), "utf8");

test("project taxonomy overrides defaults without dropping historical categories or full detail", () => {
  const trace = parseBuildtrace(`# Custom\n\n## 分类规则\n- [area | writing | 内容写作 | Writing] 稿件，不含代码。\n- [action | edit | 编辑 | Edit] 修改已有稿件。\n\n## 项目记录\n### 2026-10-16 — Edit article\n记录 ID: bt-article\n领域: writing\n动作: edit\n行动要点:\n- 修改开头\n做了什么:\n- 保留完整的修改细节，不用重点替换原文。\n\n### 2026-10-15 — Old UI fix\n场景: ux-content\n`);
  assert.deepEqual(trace.taxonomy.areas.map((item) => item.id), ["writing"]);
  assert.deepEqual(trace.entries[0].areas, ["writing"]);
  assert.deepEqual(trace.entries[0].actions, ["edit"]);
  assert.equal(trace.entries[0].sectionItems.actionHighlights[0], "修改开头");
  assert.match(trace.entries[0].sections.changes, /完整/);
  assert.deepEqual(trace.entries[1].areas, ["interface"]);
  assert.equal(trace.entries[1].classificationSource, "legacy");
  trace.entries[0].visibility = "public";
  const published = parseBuildtrace(buildPublication(trace, "public").markdown);
  assert.equal(published.taxonomy.areas[0].label, "内容写作");
  assert.deepEqual(published.entries[0].actions, ["edit"]);
  assert.equal(published.entries[0].sectionItems.actionHighlights[0], "修改开头");
  assert.match(published.entries[0].sections.changes, /完整/);
});

test("source fidelity is independent from relevance and consequential short approvals", () => {
  assert.equal(quoteKind({ fidelity: "unknown", text: "用户要求恢复资料柜。" }), "summary");
  assert.equal(quoteKind({ fidelity: "verbatim", speaker: "user", text: "不要公开" }), "original");
  assert.equal(quoteRelevance("怎么了？"), "coordination");
  assert.equal(quoteRelevance("同意", "approval"), "substantive");
  assert.equal(quoteRelevance("不要公开"), "substantive");
  assert.equal(quoteRelevance("打不开"), "substantive");
});

test("outcome handoffs include stable project identity and refuse silent cross-worktree writes", () => {
  const text = buildRecordHandoff({ title: "Travel app" }, { recordId: "bt-search", id: "unused", date: "2026-10-16", title: "Search change" }, "review", { projectRoot: "/project/travel", sourcePath: "/project/travel/private.md", branch: "ux-search" });
  assert.match(text, /Travel app/);
  assert.match(text, /bt-search/);
  assert.match(text, /\/project\/travel\/private.md/);
  assert.match(text, /ux-search/);
  assert.match(text, /工作树/);
  assert.doesNotMatch(text, /unused/);
  const legacy = buildRecordHandoff({ title: "Travel app" }, { id: "temporary-viewer-index", date: "2026-07-03", title: "Legacy" }, "review");
  assert.match(legacy, /没有固定编号/);
  assert.doesNotMatch(legacy, /Record ID: temporary-viewer-index/);
});

test("parses project intent and records from BUILDTRACE.md", () => {
  const trace = parseBuildtrace(source);

  assert.equal(trace.title, "BuildTrace Demo");
  assert.equal(trace.principles.length, 4);
  assert.equal(trace.principles[0].label, "为什么做这个项目");
  assert.equal(trace.resources.length, 3);
  assert.equal(trace.resources[0].title, "GitHub repository");
  assert.equal(trace.resources[0].category, "code");
  assert.equal(
    trace.resources.find((resource) => resource.title === "使用手册")?.url,
    "../USAGE.zh-CN.md",
  );
  assert.equal(trace.entries.length, 2);
  const sourceEntry = trace.entries.find((entry) => entry.recordId === "bt-20260110-demo-markdown-source");
  const reviewEntry = trace.entries.find((entry) => entry.recordId === "bt-20260117-demo-review-track");
  assert.equal(sourceEntry?.sourceTrust, "confirmed");
  assert.equal(sourceEntry?.status, "有效");
  assert.match(sourceEntry?.sections.why ?? "", /项目事实/);
  assert.equal(reviewEntry?.status, "待观察");
  assert.equal(reviewEntry?.decisionPrinciples[0].confirmation, undefined);
});

test("computes status and review signals", () => {
  const stats = getBuildtraceStats([
    { status: "待观察", reviewDate: "2026-07-25" },
    { status: "待观察", reviewDate: "2026-08-02" },
    { status: "有效", reviewDate: "无" },
  ], new Date("2026-07-26T12:00:00"));

  assert.deepEqual(stats, {
    total: 3,
    pending: 2,
    effective: 1,
    due: 1,
    nextReview: "2026-07-25",
  });
});

test("rejects non-string sources", () => {
  assert.throws(() => parseBuildtrace(null), /must be a string/);
});

test("assigns distinct IDs to duplicate record titles", () => {
  const duplicate = `# Duplicate\n\n## 项目初心\n\n- 为什么做这个项目: test\n\n## 项目记录\n\n### 2026-07-18 — Same title\n\n### 2026-07-18 — Same title\n`;
  const trace = parseBuildtrace(duplicate);

  assert.equal(trace.entries.length, 2);
  assert.notEqual(trace.entries[0].id, trace.entries[1].id);
});

test("keeps legacy month-only dates and annotated day dates visible", () => {
  const legacy = `# Legacy dates\n\n## 项目记录\n\n### 2025-05-26 晚 — Evening batch\n\n依据: transcript\n\n### 2026-06 — Month-only batch\n\n依据: notes\n`;
  const trace = parseBuildtrace(legacy);

  assert.deepEqual(trace.entries.map((entry) => entry.date), ["2025-05-26 晚", "2026-06"]);
});

test("ignores empty project resource placeholders", () => {
  const trace = parseBuildtrace(`# Empty resources\n\n## 项目入口 / 参考资料\n\n- GitHub:\n- Production: \n- Guide: ./guide.md\n\n## 项目记录\n`);

  assert.deepEqual(trace.resources.map((resource) => resource.label), ["Guide"]);
});

test("parses explicit project resource categories and notes", () => {
  const trace = parseBuildtrace(`# Resource categories\n\n## 项目入口 / 参考资料\n\n- [data] PostHog: https://app.posthog.com — 复盘产品行为\n- [community] Discord: https://discord.com/channels/example\n- [design] Product mockup: [Figma board](https://figma.com/file/example) — current UI\n\n## 项目记录\n`);

  assert.deepEqual(trace.resources.map((resource) => resource.category), ["data", "community", "design"]);
  assert.equal(trace.resources[0].note, "复盘产品行为");
  assert.equal(trace.resources[2].title, "Figma board");
});

test("preserves the human-written project purpose separately from agent summaries", () => {
  const trace = parseBuildtrace(`# Human purpose\n\n## 作者的话（可选）\n\n我就是我的产品的用户。\n\n人的好奇、判断和审美不应该消失在上下文压缩里。\n\n## 项目初心\n\n- 为什么做这个项目: keep context\n\n## 项目记录\n`);

  assert.equal(trace.humanPurpose, "我就是我的产品的用户。\n人的好奇、判断和审美不应该消失在上下文压缩里。");
  assert.equal(trace.principles[0].value, "keep context");
});

test("normalizes legacy backticked resource paths and infers common project tools", () => {
  const trace = parseBuildtrace(`# Legacy resources\n\n## 项目入口 / 参考资料\n\n- Production: https://example.com\n- Bing Webmaster: https://www.bing.com/webmasters/\n- 运维版号快览: \`docs/OPS-JOURNAL.md\`\n\n## 项目记录\n`);

  assert.deepEqual(trace.resources.map((resource) => resource.category), ["view", "data", "docs"]);
  assert.equal(trace.resources[2].url, "docs/OPS-JOURNAL.md");
});

test("preserves schema v2 quote provenance, requirement items, and Agent trace", () => {
  const trace = parseBuildtrace(`# Structured record

## 项目记录

### 2026-07-19 — Keep the complete reasoning trail

记录 ID: bt-20260719-reasoning-trail
来源可信度: confirmed
来源覆盖: current-turn, codex-task
关联任务: codex-thread/thread-1
依据: codex-thread/thread-1/item/item-1
场景: architecture
结果状态: 不确定
后续回看: 无

沟通原文:
- [Q1 | user | codex-thread/thread-1/item/item-1 | verbatim]
  > 第一行原话。
  >
  > 第二段原话。

需求总结:
- [R1 <- Q1] 保留完整原文。
- [R2 <- Q1] 分开记录计划和执行。

Agent 当时理解:
- [U1 <- R1,R2] 看板只是派生展示。

Agent 计划:
- [P1 <- R1] 先修数据结构。
- [P2 <- R2] 再补执行轨迹。

执行轨迹:
- [E1 <- P1 | completed] 已升级解析器。
- [E2 <- P2 | completed] 已加入执行轨迹。

为什么做:
- 不让上下文丢失。

做了什么:
- 升级记录结构。

技术备注:
- parser test

结果:
- 待验证。
`);

  const [entry] = trace.entries;
  assert.equal(entry.id, "bt-20260719-reasoning-trail");
  assert.equal(entry.recordId, "bt-20260719-reasoning-trail");
  assert.equal(entry.sourceCoverage, "current-turn, codex-task");
  assert.deepEqual(entry.sectionItems.summary, [
    "[R1 <- Q1] 保留完整原文。",
    "[R2 <- Q1] 分开记录计划和执行。",
  ]);
  assert.equal(entry.quotes[0].speaker, "user");
  assert.equal(entry.quotes[0].fidelity, "verbatim");
  assert.equal(entry.quotes[0].text, "第一行原话。\n\n第二段原话。");
  assert.equal(entry.sectionItems.agentPlan.length, 2);
  assert.equal(entry.sectionItems.executionTrace.length, 2);
});

test("parses v3 review tracks, visibility, publication metadata, and stable decision principles", () => {
  const trace = parseBuildtrace(`# Shared snapshot

## 发布信息

- 视图: team
- 生成时间: 2026-07-19T12:00:00.000Z
- 已移除: private records、absolute paths

## 项目记录

### 2026-07-19 — Review a human hypothesis

记录 ID: bt-20260719-review-track
来源可信度: confirmed
来源覆盖: current-turn
关联任务: 未记录
依据: product analytics
场景: analytics-data
关键节点: 是
可见范围: public
结果状态: 有效
后续回看: 无

人的假设:
- [H1] 更完整的复盘轨会减少归因缺口。

观察计划:
- [W1 | 指标=归因完成率 | 数据源=复盘记录 | 基线=1/3 | 目标=3/3 | 窗口=30 天 | 达成规则=三次都能完成归因] 观察真实复盘。

数据变化:
- [D1 | 日期=2026-08-19 | 指标=归因完成率 | 值=3/3 | 变化=+2 | 来源=复盘记录] 达到目标。

结果判断:
- [O1 | supported | 日期=2026-08-19] 假设成立。

决策原则:
- [dp-causal-review | 运营] 先记录假设，再用数据回看。
`);

  const [entry] = trace.entries;
  assert.equal(trace.publication.profile, "team");
  assert.equal(entry.visibility, "public");
  assert.equal(entry.milestone, true);
  assert.deepEqual(entry.hypotheses[0], { id: "H1", tag: "", text: "更完整的复盘轨会减少归因缺口。" });
  assert.equal(entry.watchPlans[0].metric, "归因完成率");
  assert.equal(entry.watchPlans[0].rule, "三次都能完成归因");
  assert.equal(entry.dataChanges[0].change, "+2");
  assert.equal(entry.outcomes[0].judgment, "supported");
  assert.equal(entry.decisionPrinciples[0].id, "dp-causal-review");
  assert.equal(trace.decisionPrinciples[0].recordId, "bt-20260719-review-track");
});

test("treats legacy records as private", () => {
  const trace = parseBuildtrace(`# Legacy privacy\n\n## 项目记录\n\n### 2026-07-19 — Old record\n\n依据: notes\n`);
  assert.equal(trace.entries[0].visibility, "private");
  assert.equal(trace.entries[0].milestone, false);
  assert.equal(trace.publication.profile, "private");
});

test("splits legacy multi-scene fields without rewriting the source", () => {
  const trace = parseBuildtrace(`# Multi scene\n\n## 项目记录\n\n### 2026-10-13 — Mixed work\n\n场景: decision / monetization / seo-growth\n`);
  assert.deepEqual(trace.entries[0].scenes, ["decision", "monetization", "seo-growth"]);
  assert.equal(trace.entries[0].scene, "decision");
});
