---
name: buildtrace
description: Preserve evidence-backed project memory before meaningful work, after meaningful changes, when restoring old context, or when reviewing whether an action later worked.
---

# BuildTrace

BuildTrace keeps project causality in the current project's `docs/buildtrace/BUILDTRACE.md`, unless that project explicitly names a different source path. Respect source overrides in every read, snapshot, status check and write. This installed Skill contains rules only. It must never contain or select another project's records.

## Activate

At meaningful work:

1. Find the writable project root.
2. If `docs/buildtrace/BUILDTRACE.md` is missing and the user has enabled automatic BuildTrace setup, run `buildtrace init --target "<absolute-project-root>"`.
3. Read the project copy at `docs/buildtrace/SKILL.md`; it is versioned with the project and contains the full schema and privacy rules.
   Also read `docs/buildtrace/PROJECT-RULES.md` when present and the project's `references/matters-and-reading.md`. Group by explicit project and matter identity, goals and acceptance boundaries; classification and phase are supporting clues, never automatic merge rules. Keep summaries linked to full evidence. Optional fields need not be filled just to complete a template. Preserve project preferences across sync.
4. Restore project intent, recent and relevant records, and due follow-ups before implementation.
5. Before changing an existing archive, run `buildtrace snapshot --target "<absolute-project-root>"`. After editing, run `buildtrace verify-history --target "<absolute-project-root>"`.
6. After a meaningful feature, fix, design, architecture, release, operational action, or important decision, update the Markdown source in the same turn.
7. Re-read the saved record or run `buildtrace status --target "<absolute-project-root>"`. In the handoff, give its title, ID and file location. Say "recorded" only after the file is saved and checked; loading rules or initializing a project is not evidence that this session was recorded.

Do not create a record for spelling fixes, pure formatting, trivial spacing changes, or disposable exploration. Fold small follow-up polish into the nearest meaningful record.

Project memory is not a chat dump. Exclude routine progress nudges and acknowledgments unless they confirm a consequential decision. Preserve complete substantive messages and meaningful attachment evidence; distinguish design references from proof of implementation. Read the project's `references/classification-and-capture.md` and custom taxonomy before classifying. Areas describe what part changed; actions describe what was done. Preserve full details alongside concise evidence-based highlights. Agent interpretation and plans must come from contemporaneous public statements, not private reasoning or hindsight.

For outcome updates, verify the intended project, source path, record ID and worktree before writing. Never append to whichever unrelated project happens to be open. Report ambiguous or divergent worktree copies for confirmation.

Keep universal evidence safeguards separate from project preferences. Do not make one user's reading order, taxonomy or review habits mandatory for everyone. Link substantive feedback to the resulting adjustment with observable dates and source references; preserve the original plan. Group small follow-up edits under the relevant work, and link later independent changes as new dated records. Do not treat a backfill date as the start or deployment date, or require metrics and hypotheses for work that has none.

## First activation in an old project

`buildtrace init` creates `.buildtrace/recovery/latest.json`. Continue the audit rather than treating installation day as project day one:

- inspect every safe accessible task/transcript page, local session, compact residue, fork/subagent lineage, Git branch/worktree, project artifact, screenshot, and authorized export;
- preserve relevant user messages verbatim when available;
- keep user words, requirement summary, Agent understanding, original plan, actual execution, evidence, and later outcome as separate layers;
- state what was searched, matched, mapped, unavailable, and unresolved;
- never claim recovery of deleted, inaccessible, or never-exported content.

## Evidence and privacy

- Markdown is the only editable truth. Viewer, JSON, JSONL, recovery manifests, and decision playbooks are derivatives.
- Existing records are append-only evidence. Do not delete or rewrite prior user quotes, interpretations, plans, or execution to satisfy a newer schema. Add a dated correction with new evidence; use `.buildtrace/history/` to audit or restore accidental changes.
- Do not infer that a commit was deployed or that a preceding action caused a later metric change.
- Old and new records default to `private`; only the user can authorize `team` or `public`.
- Never mix records between projects, even when the global Skill is shared.
- Viewer is read-only. Do not create `nodes.json` or browser storage as a second source.

## User phrases

Fixed phrases are optional. Ordinary natural language should activate the same behavior.

- “为这个项目启用 BuildTrace，并尽可能恢复此前上下文” → initialize, audit, report coverage, then continue.
- “恢复上下文” → read relevant project memory and accessible evidence.
- “记录本轮” → fill a missed meaningful record.
- “补记后来结果” → add later data and judgment to the existing record.
- “修正这条记录” → correct the fact and its evidence, without rewriting history as if the Agent knew it earlier.

Decision playbooks accept only principles explicitly marked `确认=user-confirmed` by the user, attached to a `confirmed` source record with evidence. Never turn an Agent-generated summary into the user's personal method.
