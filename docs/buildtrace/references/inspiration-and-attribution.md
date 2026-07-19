# Validated patterns, inspiration, and attribution

BuildTrace should not invent a category from an empty page. Before adding a substantial capability, first ask whether users have already proved the need through repeated use of a mature product, open standard, or open-source project. The goal is not to copy a competitor screen; it is to reuse a validated problem model and spend original effort only where BuildTrace is meaningfully different.

## Decision rule

For every substantial product capability:

1. Name the user pain in plain language.
2. Find first-party evidence that one or more mature products already serve it.
3. Choose the lightest suitable reuse level: link/export, API connector, open schema, dependency, interaction pattern, or original implementation.
4. Record what is borrowed, what remains different, and why BuildTrace should build anything itself.
5. If third-party code, assets, schemas, or hosted APIs are used, complete the license and terms review before shipping.

Popularity alone is not proof of fit. A pattern is adopted only when it helps BuildTrace preserve human intent, Agent execution, external evidence, or later outcomes without turning the product into a generic task manager, wiki, or analytics system.

## Pattern ledger

| Source | Need already validated | What BuildTrace adopts | What BuildTrace does not rebuild |
| --- | --- | --- | --- |
| [Cline Memory Bank](https://cline.bot/blog/memory-bank-how-to-make-cline-an-ai-agent-that-never-forgets) | Project context must survive a new chat or a full context window. | Project-local Markdown, restore-before-work, update-after-meaningful-work, and context that a new Agent can read without the old chat. BuildTrace extends this with transcript recovery, source fidelity, original words, forks, multi-Agent traces, and outcomes. | A second coding-agent memory system or Cline-compatible prompt bundle. |
| [Linear Projects](https://linear.app/docs/projects) and [Project Updates](https://linear.app/docs/initiative-and-project-updates) | People need project resources, chronological updates, health, reminders, and stale-update signals in one project surface. | Resource cabinet, dated records, due reviews, update history, and future stale-context reminders. | Issue tracking, team planning, assignments, or a general project-management suite. |
| [PostHog annotations](https://posthog.com/docs/user-guides/annotations) | A product change is easier to interpret when it is marked on the same time axis as metrics. | Actions and external signals aligned with metric windows, while keeping correlation separate from human-confirmed causality. | Product analytics, event storage, funnels, or session replay. |
| [Apache DevLake](https://devlake.apache.org/) | Engineering evidence is fragmented across Git, CI, project systems, and collaboration tools. | A connector contract with source identity, sync time, coverage, freshness, and normalized external-signal candidates; future adapters may consume DevLake exports instead of rebuilding its collectors. | A DevOps data lake, DORA metric engine, or Grafana replacement. |
| [ONES Project and Wiki](https://docs.ones.com/zh-Hans/get-started/quick-start-guide-to-ones-project) and [ONES milestones](https://ones.cn/blog/product-guide/product-guide-03) | Work items, knowledge, deliverables, milestones, dependencies, and baselines need explicit links. | Evidence-linked milestones, deliverables as sources, and baseline-versus-result comparisons. | Gantt planning, resource allocation, sprint boards, or enterprise PMO workflows. |
| [TAPD](https://www.tapd.cn/home/solution/tapdlite) | Requirements, iterations, defects, reports, releases, and accumulated knowledge form one lifecycle. | Links between product decisions, implementation records, release facts, feedback, and outcome reviews. | Agile workflow, defect tracking, testing management, or team reporting. |
| [amber.ac](https://amber.ac/) | A technical product can feel precise and distinctive through dark editor-like chrome, hairline structure, monospace metadata, and a sparse signal color instead of decorative card styling. | A calm project-console vocabulary: near-black layers, square controls, comment-like labels, low-contrast grid lines, and green only for active source and action signals. | Amber branding, copy, ASCII animation, layout, source code, or visual assets. BuildTrace keeps its own dense three-column information architecture and readable Chinese long-form type. |

This ledger is a maintained design input, not a claim of endorsement, partnership, or feature parity.

## Attribution and license policy

There are three different cases and they must not be blurred together:

1. **Pattern inspiration only.** Link the official product or project here and in the README, and state the specific idea learned. This is transparent attribution; no third-party code is included and no software license is inherited merely by learning from the pattern.
2. **API or export integration.** Name the compatible service factually, link its official documentation, follow API terms and trademark rules, and keep credentials outside `BUILDTRACE.md`.
3. **Code, assets, or schemas copied or adapted.** Record the exact files and version, preserve required copyright and license notices, include the applicable license text or `THIRD_PARTY_NOTICES.md`, and document local changes. A thank-you line alone is not license compliance.

Current status: BuildTrace has learned product and visual patterns from the sources above, but no source code or visual assets from those products have been copied into BuildTrace. Cline is Apache-2.0, Apache DevLake is Apache-2.0, and the PostHog repository is MIT except for its separately licensed `ee` directory; those licenses matter only if their code is actually incorporated.

## Cross-session context is a base contract

Cross-session continuity is not an optional dashboard feature. A BuildTrace-enabled project should let a new Agent recover enough verified context to work safely before editing:

- read the project purpose and relevant durable records;
- audit matching current and archived tasks, compact residues, fork and multi-Agent relations when initializing an existing project;
- distinguish exact original text from summaries, inference, and unavailable history;
- expose what was searched, matched, mapped, and still missing;
- update the durable record after meaningful work so the next session does not depend on the current context window.

The completion test is not “the Agent produced a summary.” It is “a new Agent can identify the user’s intent, the prior Agent’s understanding and plan, the actual changes, the evidence, the unresolved gaps, and the next review without pretending inaccessible history was recovered.”
