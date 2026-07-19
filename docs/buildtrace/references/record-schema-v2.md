# BuildTrace record schema v2

> v2 仍可读取。新记录使用包含复盘轨、决策原则和发布可见范围的 [`record-schema-v3.md`](./record-schema-v3.md)。

`docs/buildtrace/BUILDTRACE.md` remains the only editable project-memory source. The structure is readable Markdown first; JSON and JSONL are generated derivatives.

## Stable record fields

```md
### YYYY-MM-DD — 标题

记录 ID: bt-YYYYMMDD-short-name
来源可信度: confirmed | inferred | unknown
来源覆盖: current-turn, codex-task, local-rollout, git, project-files
关联任务: codex-thread/<thread-id>
依据: source references
场景: architecture
结果状态: 待观察
后续回看: YYYY-MM-DD
```

`记录 ID` never changes when the title changes. Older records without an ID remain readable but should receive one when they are meaningfully edited.

## Full original words

Store every relevant user message in full. Do not join several messages into a cleaner invented quote.

```md
沟通原文:
- [Q1 | user | codex-thread/<thread-id>/item/<item-id> | verbatim]
  > 用户消息的完整第一行
  >
  > 用户消息的其余原文。
```

The four metadata parts are quote ID, speaker, source reference, and fidelity. If only a compacted summary exists, use `compacted-summary` and never put reconstructed text under `verbatim`.

## Interpretation, plan, and execution are different

```md
需求总结:
- [R1 <- Q1] 第一件明确需求。
- [R2 <- Q1] 第二件明确需求。

Agent 当时理解:
- [U1 <- R1,R2] Agent 在接到需求时实际表达的理解；没有捕捉就写未捕捉。

Agent 计划:
- [P1 <- R1] 第一步计划。
- [P2 <- R2] 第二步计划。

执行轨迹:
- [E1 <- P1 | completed] 实际完成的动作与证据。
- [E2 <- P2 | changed] 原计划改变了什么以及为什么。
```

`Agent 计划` records intent at the time. `执行轨迹` records what actually happened. Never rewrite the plan after the fact to make it look linear.

## Portable derivatives

`buildtrace export --format json` produces one project object with records, structured section items, parsed quote provenance, resources, and project intent. `--format jsonl` emits one project line followed by one line per record. These files can feed a database, search index, notebook, static site, or a future cross-project view, but they are regenerated from Markdown and never become a competing source of truth.
