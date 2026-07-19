# BuildTrace history recovery architecture

BuildTrace treats recovery as an evidence audit, not a promise that every past thought can always be reconstructed.

## Recovery order

1. **Current task:** capture full user messages, Agent messages, plan changes, tool calls, file changes, checks, and the final result while they are still directly accessible.
2. **Codex task API:** list matching project tasks, page every turn with `read_thread`, and retain stable task, turn, and item identifiers. A `contextCompaction` marker is recorded as an event; it does not replace exact messages that the task API can still return.
3. **Local Codex rollouts:** audit both active and archived JSONL rollouts under the configured Codex home. Match by canonical project path and Git origin. Preserve source hashes and message references before extracting relevant records.
4. **Fork and multi-Agent graph:** read native parent/child metadata when available. For subagents, keep parent thread, child thread, Agent path, role, task, handoff, and result. If a user-created fork has no exposed parent ID, compare stable message IDs or shared content prefixes and label the relationship `inferred`.
5. **Project evidence:** inspect Git history, branches, worktrees, documentation, screenshots, exports, deployment records, test output, and data snapshots. These sources can establish what happened, but cannot manufacture a missing human motive.
6. **Cross-tool and external sources:** use user-provided exports or authorized connectors for Cursor, Claude, ChatGPT, GitHub, analytics, deployment, support, and other systems. Never bypass access controls.

## Evidence fidelity

Every recovered fragment uses one fidelity value:

- `verbatim`: exact message or exact source text is accessible.
- `compacted-summary`: only the platform's compacted summary is accessible.
- `artifact-evidence`: a file, commit, test, screenshot, or event proves an action or result but not the original words.
- `inferred`: a relationship or interpretation is reconstructed from several sources.
- `unavailable`: the expected source is deleted, inaccessible, or was never exported.

Mixed-fidelity material must not be hidden behind one record-level confidence label. Exact quotes, Agent interpretations, action evidence, and later outcomes retain their own provenance.

## Recovery manifest

`buildtrace recover` writes `.buildtrace/recovery/latest.json`. It is a private, derived inventory, not a project-memory source and not a Viewer input. It contains source coverage, matching task IDs, rollout hashes, compacted-window counts, message references, multi-Agent edges, Git coverage, and unresolved gaps. It deliberately does not duplicate entire private transcripts.

The Agent uses that manifest together with task-reading tools to promote relevant evidence into `docs/buildtrace/BUILDTRACE.md`. The promotion step is where complete relevant user messages, the Agent's contemporaneous understanding, requirements, plan, execution trace, and outcome become portable project memory.

## Completion rule

Recovery is complete only relative to an explicit coverage statement. A valid report says what was searched, what matched, what was promoted, what remains unmapped, and what could not be accessed. “Recovered everything” is invalid unless every declared source class was audited and none has an unresolved gap.
