# BuildTrace Design System

## Product posture

BuildTrace is a read-only project memory surface, not an analytics dashboard. It preserves the human authorship of a project: curiosity, judgment, taste, assumptions, interventions, and the later evidence that supports or overturns them. Its job is to help a person or a new Agent answer four questions quickly:

1. Why did we make this decision?
2. What actually changed?
3. What evidence supports the record?
4. Did the result work?

The interface should feel like an editorial field notebook paired with a calm command desk: serious enough to trust, light enough to scan every day.

## Product model

BuildTrace has three layers, in this order:

1. **Human layer:** a separately preserved “为什么做（人写的）”, original words inside records, and the person’s own decision patterns. Agent summaries may organize this material but must not replace it.
2. **Causal project layer:** each intervention connects intent, action, evidence, expected signal, review date, and outcome. This is the everyday board.
3. **Cross-project learning layer:** recurring judgment patterns can later become a personal playbook across projects, while every project remains the source of truth for its own facts.

Current product capabilities deepen this model instead of adding generic dashboard widgets:

- **Hypothesis review:** store “I think / I worry / I guess” as a hypothesis with an expected signal and review window; later mark it supported, refuted, mixed, inconclusive, or pending.
- **Data-aligned intervention lane:** place launches, SEO changes, content changes, deployments, and operations events on the same date axis as imported analytics snapshots. BuildTrace should help inspect causality without claiming that correlation proves it.
- **Capture coverage:** show which sources are available, missing, stale, or inaccessible across Git, deploys, analytics, chats, and manual notes. Never imply that unavailable history was recovered.
- **Personal decision playbook:** stable `dp-*` IDs aggregate repeated reasoning patterns, aesthetic rules, and operating principles across projects, with links back to the concrete records that produced them. Same-ID wording conflicts remain visible for human review.
- **Private / team / public views:** local is private by default. Team and public views are generated derivatives, not client-side filters. Team sharing still requires access control; the public profile includes only explicitly public records and removes original words, local paths, Agent process, technical notes, resources, and internal evidence before publication.

## Validated-pattern policy

BuildTrace does not begin substantial features from a blank-page brainstorm. It first looks for a mature product, open standard, or open-source project that has already demonstrated the underlying user need, then chooses the lightest reuse level that preserves BuildTrace's product boundary.

The preferred order is:

1. Link to or import an existing artifact.
2. Consume an official export or API.
3. Reuse an open schema or licensed dependency.
4. Adopt a proven interaction or information pattern with attribution.
5. Build original infrastructure only when the human-intent-to-outcome causal chain requires behavior the existing system does not provide.

The current pattern map is deliberate:

- Cline Memory Bank validates project-local, cross-session Markdown context and the read-before-work / update-after-work lifecycle.
- Linear validates project resources, chronological updates, review cadence, health, and stale-update visibility.
- PostHog annotations validate placing product interventions on the same time axis as metrics.
- Apache DevLake validates connector-based collection and normalization across fragmented development tools.
- ONES validates links among Wiki knowledge, work items, deliverables, milestones, dependencies, and baselines.
- TAPD validates treating requirements, iterations, releases, defects, reports, and knowledge as one product-development lifecycle.

BuildTrace adopts these problem models but does not become another task tracker, wiki, analytics engine, PMO suite, or DevOps data lake. Its distinct job is to preserve original human judgment, the Agent's contemporaneous interpretation and execution, external evidence, and later outcomes with auditable provenance. The maintained source and attribution ledger is `docs/buildtrace/references/inspiration-and-attribution.md`.

## Source-first recovery architecture

The board is a derivative. The product core is an auditable recovery and promotion pipeline:

1. Discover every safe project-matching source available in the current environment: current task, paged Codex tasks, active and archived local rollouts, compact events, fork and subagent relations, Git branches and worktrees, project artifacts, user-provided exports, and authorized external systems.
2. Inventory before summarizing. A private recovery manifest records stable source IDs, hashes, time ranges, message references, Agent edges, coverage, and inaccessible gaps without copying entire private transcripts.
3. Promote relevant evidence into Markdown. Complete relevant user messages, the Agent's contemporaneous interpretation, itemized requirements, the original plan, actual execution, verification, and later outcome become the portable project record.
4. Generate JSON, JSONL, Viewer data, search indexes, or future cross-project views from Markdown. Generated forms never become competing editable sources.

Evidence fidelity is fragment-level: `verbatim`, `compacted-summary`, `artifact-evidence`, `inferred`, or `unavailable`. A compact event is not proof that exact history is gone; exact earlier messages remain preferred whenever task pagination or local rollout evidence still exposes them. A missing fork parent or inaccessible external conversation is a visible coverage gap, not an invitation to reconstruct a cleaner story.

The record keeps human and Agent authorship distinct:

- complete original user messages with stable quote and source references;
- itemized requirements linked to those quotes;
- what the Agent actually understood at the time;
- the plan the Agent proposed before execution;
- the execution trace, including plan changes, subagent handoffs, tools, files, checks, and failures;
- the later outcome and its evidence.

This structure is specified in `docs/buildtrace/references/record-schema-v3.md`; the source audit and completion rules are specified in `docs/buildtrace/references/recovery-architecture.md`.

## Outcome and milestone model

An action becoming effective and a project reaching a milestone are related, but they are not the same fact.

- **Action record:** what a person decided and changed, including the original judgment and why it was worth trying.
- **Watch contract:** what signal should change, its baseline and target, the observation window, source, and threshold rule.
- **External signal:** a deployment, metric snapshot, payment, store release, review, press mention, contract, or other dated fact. It may be collected automatically without proving causality.
- **Outcome review:** the person’s conclusion that the action was supported, overturned, still unclear, or no longer worth observing.
- **Milestone:** a confirmed project-state change that matters beyond one task, such as first production release, 1,000 users, 100 paid orders, a financing close, or a major partnership.

A milestone can link to multiple actions with a relationship of `contributed`, `related`, or `unknown`. Reaching 1,000 users is a fact; it does not automatically prove that the last redesign caused those users.

### Reusable outcome recipes

Product archetypes only suggest defaults. The reusable unit is the kind of outcome being observed because one project can contain several product forms at once.

| Outcome recipe | Typical signals | Example milestone |
| --- | --- | --- |
| Reach | impressions, indexed pages, visitors, followers | first 10,000 organic impressions |
| Use / activation | key action completion, feature adoption, active users | 1,000 people completed the core task |
| Retention / relationship | return rate, renewal, repeat purchase, active members | 100 recurring users or 50 renewals |
| Quality / trust | error rate, crash rate, failed queries, complaints | critical error rate stays below target for 30 days |
| Revenue / exchange | paid orders, MRR, affiliate conversions, donation total | first ¥10,000 revenue or 100 paid orders |
| Organization / company | launch, partnership, hiring, financing, legal approval | financing closed or first institutional partner |

### Minimum structured watch contract

The user should be able to say “一个月后看自然搜索用户能不能从 800 到 1,000”; the Agent converts that language into a compact structured block. A form is optional, not the default path.

```md
观察计划:
- [W1 | 指标=30 天自然搜索用户 | 数据源=GA4 | 基线=800 | 目标=>= 1000 | 窗口=2026-07-19 至 2026-08-19 | 达成规则=窗口内首次达到] 验证 SEO 动作是否伴随目标变化。
```

Manual review stays short and preserves human judgment:

```md
数据变化:
- [D1 | 日期=2026-08-13 | 指标=30 天自然搜索用户 | 值=1043 | 变化=达到目标，比预期早 6 天 | 来源=GA4] 同期还有内容更新。

结果判断:
- [O1 | mixed | 日期=2026-08-13] SEO 修复可能有贡献，但同期内容更新使单一归因不成立；保留策略，再观察查询完成率。
```

Threshold rules must state whether success means crossing once, sustaining for a period, changing relative to baseline, or receiving confirmation of a one-time event. A missing result at the review date triggers a review; it does not automatically mean failure.

### Collection boundary

- **Event push:** verified webhooks for deployment, payment, subscription, order, or store-state events can create external-signal candidates quickly.
- **Scheduled pull:** analytics, search, app-store, reliability, repository, and revenue reports are better checked daily or weekly because their data can be delayed or revised.
- **Manual structured fact:** financing, partnership quality, offline attendance, user interviews, aesthetic judgment, and strategic learning require a person’s confirmation even when an external page or document exists.
- **Hybrid anomaly:** automation can notice a threshold crossing or unusual movement and prepare a candidate milestone; a person confirms importance and attribution.

Connector credentials never belong in `BUILDTRACE.md`. A collector may draft a Markdown patch or pull request, but the confirmed project record remains in the single Markdown source.

### Timeline presentation

The board offers three everyday lenses over the same source: `项目脉络`, `复盘轨`, and `决策手册`. Milestone presentation remains the next extension of the review track rather than a fourth competing data source.

- The main timeline uses a point for the action, a thin observation band for the watch window, small ticks for external signals, a result marker for the review, and a diamond only for a confirmed milestone.
- Planned dates are dashed; observed dates are solid. The interval can show `T+23 days` without pretending the whole interval was active work.
- The selected detail shows `baseline → current → target`, last source refresh, threshold rule, evidence, and the human conclusion.
- Desktop can use horizontal causal bands grouped by outcome recipe. Mobile uses the same thread as a vertical story so milestones and review actions remain readable without sideways scrolling.
- Automatic candidates and confirmed milestones must use different labels and shapes, not color alone.

## Information architecture

- **Tutorial / 教程** explains the workflow in four short steps and never blocks access to the data.
- **Board / 看板** opens on the strongest current signals: total records, pending reviews, effective decisions, and the next review date.
- The desktop board is a three-column workbench: project navigation and workflows, a dense timeline and record index, then one focused causal detail pane.
- Project resources and the automatic capture flow remain visible working tools, not promotional content. The flow explains how ordinary conversation becomes a record; only correction and outcome-review actions copy explicit Agent instructions, and none create browser-side truth.
- The human-written project purpose sits immediately below the Viewer introduction. Its first paragraph is scannable and the complete original can be expanded without being rewritten by the Viewer.
- The project resource cabinet groups code, docs, references, analytics, deployment, payments, admin, design, and community links. “Add resource” creates an Agent handoff command; it never edits browser state.
- The deployment center starts with a privacy warning, then offers local, GitHub Pages, Cloudflare Pages, and Vercel instructions. Public hosting is never presented as the default.
- Tablet keeps the project rail and record workspace; detail opens as a focused overlay.
- Mobile begins with compact status, workflow, resource and evidence utilities, followed by timeline and record list; record detail opens full-screen with a clear back action.
- Search and filters change the visible index only. They never mutate `BUILDTRACE.md`.

## Voice and bilingual rules

- Product chrome is available in Simplified Chinese and English.
- Recorded project content remains in its source language. Never machine-translate evidence or user quotes silently.
- Chinese is the default because the current project record is written in Chinese.
- Labels are short nouns or verb phrases. Avoid welcome copy, slogans, and explanatory paragraphs in the working view.
- Date, status, source trust, and evidence are always visible before the longer narrative.

## Visual language

- **Canvas:** near-black green `#141714`
- **Raised surface:** `#1A1D1A`
- **Deep chrome:** `#0D0F0D`
- **Primary ink:** `#F1F6F2`
- **Muted ink:** `#89948C`
- **Rule:** `#2B302C`
- **Signal green:** `#5DF079` for selected controls, source status, links, and focus
- **Pending amber:** `#F0BD64`
- **Confirmed green:** `#72E7A2`
- **Invalid red:** `#F08D83`
- **Display and long-form type:** Avenir Next / Noto Sans SC / PingFang SC
- **Metadata and chrome type:** SFMono-Regular / Menlo / monospace

The visual metaphor is a calm project console: thin rules, square corners, low-contrast grids, comment-like labels, and one bright signal color. Monospace belongs to navigation, dates, provenance, commands, and labels; Chinese explanations, original words, and long causal records stay in the interface typeface. Borders organize the app, not floating cards. Shadows appear only when an overlay must separate from the underlying workbench.

[amber.ac](https://amber.ac/) is the explicit reference for this terminal-like visual restraint: dark chrome, code-editor rhythm, hairline structure, and sparse green signals. BuildTrace does not copy its branding, content, ASCII animation, source code, or assets; it adapts only a visual vocabulary to a much denser, long-form project-memory product.

## Spacing and density

- Base unit: `4px`
- Working rhythm: `8, 12, 16, 24, 32, 48`
- Comfortable record row: `104px` minimum in the workbench
- Compact record row: `88px` minimum
- Desktop content max width: `1600px`
- Touch targets: `44px` minimum
- Desktop system bar: `50px`; mobile system bar: `56px`
- Type ladder: `9–10px` metadata, `11–13px` interface labels, `14–16px` body, `24–48px` selected-record and orientation titles

## Motion

- Press feedback: `transform: scale(0.97)` for `120ms`
- View entry: opacity + `translateY(6px)` for `220ms` with `cubic-bezier(0.23, 1, 0.32, 1)`
- Mobile detail: `translateX(100%)` to `0` for `240ms`
- No animation on search, keyboard navigation, or repeated filter changes.
- `prefers-reduced-motion` removes spatial motion while retaining short opacity changes.

## Accessibility and responsive behavior

- Visible focus rings use the signal green and never depend on browser defaults alone.
- Mobile long-form copy is `14–16px` with at least `1.7` line-height; metadata is never used for paragraph text.
- Status never relies on color alone; every status includes text.
- At `1440px`, the right detail rail becomes an overlay while the project rail and record workspace remain visible.
- At `760px`, utility sections stack above the record workspace and detail remains a full-screen overlay.
- At `640px`, primary navigation becomes a fixed bottom bar and the four signals become a readable `2 × 2` grid.
- No horizontal page scrolling at any supported viewport.
