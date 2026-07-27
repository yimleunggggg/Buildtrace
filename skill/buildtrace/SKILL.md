---
name: buildtrace
description: Preserve evidence-backed project memory before meaningful work, after meaningful changes, when restoring old context, or when reviewing whether an action later worked.
---

# BuildTrace

BuildTrace keeps project causality in the current project's `docs/buildtrace/BUILDTRACE.md`. This installed Skill contains rules only. It must never contain or select another project's records.

## Activate

At meaningful work:

1. Find the writable project root.
2. If `docs/buildtrace/BUILDTRACE.md` is missing and the user has enabled automatic BuildTrace setup, run `buildtrace init --target "<absolute-project-root>"`.
3. Read the project copy at `docs/buildtrace/SKILL.md`; it is versioned with the project and contains the full schema and privacy rules.
4. Restore project intent, recent and relevant records, and due follow-ups before implementation.
5. After a meaningful feature, fix, design, architecture, release, operational action, or important decision, update the Markdown source in the same turn.

Do not create a record for spelling fixes, pure formatting, trivial spacing changes, or disposable exploration. Fold small follow-up polish into the nearest meaningful record.

## First activation in an old project

`buildtrace init` creates `.buildtrace/recovery/latest.json`. Continue the audit rather than treating installation day as project day one:

- inspect every safe accessible task/transcript page, local session, compact residue, fork/subagent lineage, Git branch/worktree, project artifact, screenshot, and authorized export;
- preserve relevant user messages verbatim when available;
- keep user words, requirement summary, Agent understanding, original plan, actual execution, evidence, and later outcome as separate layers;
- state what was searched, matched, mapped, unavailable, and unresolved;
- never claim recovery of deleted, inaccessible, or never-exported content.

## Evidence and privacy

- Markdown is the only editable truth. Viewer, JSON, JSONL, recovery manifests, and decision playbooks are derivatives.
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
