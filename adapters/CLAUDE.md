<!-- buildtrace:managed-adapter -->
# BuildTrace project memory

Before meaningful work, read `docs/buildtrace/SKILL.md` and restore the relevant purpose, records, due follow-ups, and accessible historical evidence. After a meaningful completed change or important decision, update `docs/buildtrace/BUILDTRACE.md` in the same turn.

Before editing an existing archive, run `buildtrace snapshot --target .`; after editing, run `buildtrace verify-history --target .`. Treat existing quotes, requirement summaries, contemporaneous understanding, plans, and execution as append-only evidence. Corrections add dated evidence and must not silently rewrite the old account.

Ordinary natural language is the trigger. Keep complete relevant user words, requirement summary, Claude's contemporaneous understanding, original plan, actual execution, evidence, and later outcome separate. On first activation, continue from `.buildtrace/recovery/latest.json` and inspect safe matching Claude sessions, compact summaries, forks/subagents, Git history, project artifacts, and authorized exports.

The Markdown file is the only editable project-memory source. Never use another project's archive, Viewer state, browser storage, or `nodes.json`.
