# BuildTrace

Recent improvements: records can share an explicit matter ID across sessions and tools. Summaries link to full evidence; discussion, execution, delivery checks and later feedback have distinct meanings and optional sections. Existing archives remain readable. Project preferences live in `docs/buildtrace/PROJECT-RULES.md` and survive sync.

Use `buildtrace overview --target /project/a --target /project/b` for selected local projects; this is not an inventory of the whole computer. Run `buildtrace discover --root /projects --output /new/private-report.json`, then `buildtrace overview --project-list /private-report.json` to inspect discovered archives, rules-only candidates, historical locations, exports and worktrees within the reported scope. Discovery never initializes or merges projects. Viewers start on demand using shared installed assets and do not write snapshots or files into inspected projects. Metadata refreshes every 10 seconds. For source overrides, a project list may contain `{ "target": "/project", "source": "/project/private.md" }` entries.

`buildtrace export --format handoff|claude-memory|langchain-md --output /new/file.md` generates private context projections; `--format bundle --output /new/directory` preserves original Markdown, parsed JSON and a SHA-256 manifest (linked attachments are not copied). These are not sanitized publications or automatic platform imports. Claude may extract or omit information, and LangChain requires persistent storage and retrieval configuration; external platform ingestion has not been verified. Use `publish` for sharing. `sync --target /project --check` reports managed-file differences without writing.

[简体中文](README.md) · [English](README.en.md)

BuildTrace keeps the part of an AI-assisted project that is easiest to lose: why a person made a decision, how an Agent interpreted and carried it out, what changed afterwards, and whether the original judgment held up.

Current release: `v1.18.0-alpha.1`

## Start in three steps

1. Give a coding AI with project-file and terminal access this request:

   > Install BuildTrace from https://github.com/yimleunggggg/Buildtrace and enable it for future projects with `buildtrace setup`. Preserve my existing Agent settings. Then enable it in this project, recover accessible history, save this session's meaningful work, and show me the saved record and board address.

   Or run this yourself (Node.js 20+ required), then reopen your Agent or start a new session:

   ```bash
   npm install -g git+https://github.com/yimleunggggg/Buildtrace.git && buildtrace setup
   ```

2. Work normally. For an existing project, say “Enable BuildTrace here and recover accessible history first.” Your AI should report inaccessible sources honestly, not invent missing conversations. You do not need a special command after each change.

3. Ask “Open this project's BuildTrace board.” To check it yourself, run these inside the project:

   ```bash
   buildtrace status --target .
   buildtrace serve --target .
   ```

   Open the address printed by the second command and keep that terminal running. This address works only on your computer; other devices need a separately hosted board. The source file updates when your AI saves a record, and the local board checks for those changes every 10 seconds.

BuildTrace currently relies on your AI following the installed instructions. It is not a background service that captures every chat. Ask for the saved record title, ID and file path when checking that recording worked.

The current board is per project; a unified local project homepage is not implemented. Run different projects on different ports, or add `--port 0` to choose an available port. Use the printed address. Installing global instructions does not start a persistent board service.

## Why I made it

I am not an engineer. My background is in user operations, communities, and offline events. After using AI to build several small products around my own interests, I kept running into the same problem: code changed quickly, but the project forgot why.

Git could tell me which files changed, and an Agent could summarize the current session. A few weeks later, looking at the data, I still could not remember why I made a change, what I expected, or whether it worked. The easiest things to lose were lines like:

> I think visitors arriving from Bing probably have Japanese-language intent.
>
> At this stage, ignore conversion and get the page indexed first.

BuildTrace keeps those human words and hypotheses beside the Agent's interpretation, the work that was actually done, and the evidence that appeared later. Git records what a project became. BuildTrace records why it became that way, and whether the original judgment held up.

[Read the full first-person story in Chinese](https://mp.weixin.qq.com/s/OBF-aNReio1grgVbTYSYzg), or read the shorter [repository introduction](docs/INTRODUCTION.zh-CN.md).

## What it records

```text
human words and hypothesis
          ↓
the Agent's interpretation and plan at the time
          ↓
what was actually done
          ↓
later data or external facts
          ↓
human review: supported, refuted, mixed, or inconclusive
```

The editable source is one project-local Markdown file: [`docs/buildtrace/BUILDTRACE.md`](docs/buildtrace/BUILDTRACE.md). The Agent writes evidence-backed records. The Viewer only reads them. Git, issue trackers, analytics, and deployment systems keep doing what they are good at; BuildTrace links their evidence to the human reason and the later outcome.

Today it can:

- preserve complete relevant user messages, itemized requirements, the Agent's contemporaneous interpretation, original plan, and actual execution trace;
- audit still-readable Codex tasks and rollouts, compaction markers, multi-Agent traces, Git branches, project artifacts, and user-provided exports;
- show the same source as a project timeline, an action-to-outcome review lane, or an evidence-linked personal decision playbook;
- generate separate `private`, `team`, and redacted `public` derivatives;
- export JSON / JSONL and aggregate stable `dp-*` principles across projects without silently merging conflicting wording.

## Tested beyond the demo

BuildTrace is dogfooded in the maintainer's own workspace and in a separate production project. Those real archives stay inside their respective local projects: they are not tracked in this repository, included in the install package, or copied into a new user's project.

The tracked [`docs/buildtrace/BUILDTRACE.md`](docs/buildtrace/BUILDTRACE.md) is synthetic demo data. Real-project testing still matters because it catches the difference between copying a dashboard template and maintaining living project memory during ongoing product work.

## Install once, give each project its own records

Requires Node.js 20 or later.

```bash
npm install -g git+https://github.com/yimleunggggg/Buildtrace.git && buildtrace setup
```

This installs a clean, rule-only Skill and idempotent user-level auto-activation instructions for Codex, Cursor, Claude Code, GitHub Copilot, Windsurf, and Gemini CLI. The global Skill contains no `BUILDTRACE.md` and no maintainer or downstream-project archive.

Run the same command again to upgrade a GitHub installation. Contributors who clone this repository and run `node bin/buildtrace.mjs setup` get live links to the checkout, so edits to the repository's clean Skill appear locally without another copy step.

The user-level Skill becomes discoverable from every repository. With automatic setup enabled, supported Agents are instructed to initialize a writable project on first meaningful work, not to scan and change every project on your disk. Each project needs its own source, instructions, history audit and board. You can also initialize explicitly:

```bash
buildtrace init --target /path/to/your-project
```

Update an installed project from the latest BuildTrace checkout:

```bash
node bin/buildtrace.mjs sync --target /path/to/your-project
```

`sync` updates managed Viewer, Skill, CLI, reference, and deployment files after backing up the previous copies. It does not rewrite the project's `BUILDTRACE.md`. In shared Agent instruction files such as `AGENTS.md`, it updates only the marked BuildTrace block and preserves other instructions.

## Everyday use

The board starts with changes, reasons and current outcomes; full detail, original messages and the AI's stated plan/actions remain expandable. Historical paraphrases are labeled as summaries, not exact words. Routine status nudges are not core project memory. Categories have two independent dimensions—area and action—with project-local names and rules. Outcome requests carry the specific project, record ID and available worktree/source context; paste them into an AI with access to that project.

Once the project instructions are active, no fixed command is required. Speak normally:

> Prioritize Japanese search indexing for now. Review impressions and clicks in two weeks before changing conversion.

> This result did not improve anything. Update the original record and mark the hypothesis as refuted.

> Restore why this project chose the current data structure before changing it.

Before meaningful work, the Agent reads the purpose, related history, recent records, and due reviews. After a meaningful feature, fix, decision, release, or operation, it writes the conversation, interpretation, plan, execution, and verification back in the same turn.

Recording currently depends on your working AI following the instructions; there is no background collector that guarantees every conversation is captured. After saving, your AI should show the record title, ID and file path. Check the actual archive with `buildtrace status --target .`.

Project initialization now backs up an existing `AGENTS.md` and adds a managed BuildTrace block without a manual merge. Tools such as WorkBuddy that read this file can use the same project rules; this does not imply dedicated conversation capture support.

Existing evidence is not a scratch document. BuildTrace keeps content-addressed local snapshots. `verify-history` compares records with stable IDs against a saved baseline and reports changes to protected evidence fields, including prior quotes, requirements, understanding, plans and execution. It is a post-edit check, not a filesystem write blocker; records without stable IDs and fields outside that comparison still require review:

```bash
buildtrace snapshot --target .
buildtrace verify-history --target .
buildtrace history --target .
```

Snapshots live in Git-ignored `.buildtrace/history/`. Restore an inspected version with `buildtrace restore --target . --snapshot <hash-prefix> --confirm`; the current version is snapshotted before restoration. Keep an independent backup as well. `audit-quotes` checks declared provenance and fidelity metadata; it does not compare the archive against all original transcripts or prove that every message was captured. Missing original text must be reported, never invented.

Run the private local Viewer inside a project:

```bash
node docs/buildtrace/viewer/serve.mjs
```

The Viewer is already static HTML, CSS, and JavaScript. Through the local server it checks the Markdown source every 10 seconds, pauses while the page is hidden, and reads saved changes without a rebuild. A hosted static board updates only after the new files are deployed. Opening `index.html` directly through `file://` is not a supported path.

## Recovery is an audit, not a promise of magic

`init` and `recover` inventory every safe project-matching source the local environment exposes: current and archived Codex rollouts, Claude Code project sessions, compaction markers, multi-Agent or sidechain edges, Git branches, likely conversation exports, and project evidence.

```bash
node bin/buildtrace.mjs recover --target /path/to/project
```

The report distinguishes searched, matched, mapped, unmapped, inferred, and inaccessible sources. Deleted, unauthorized, or never-exported conversations cannot be reconstructed. Native fork lineage is not always exposed. BuildTrace must show those gaps rather than invent a clean history.

## Review and reuse

Export portable data:

```bash
node bin/buildtrace.mjs export --target /path/to/project --format json --output /path/to/buildtrace.json
node bin/buildtrace.mjs export --target /path/to/project --format jsonl --output /path/to/buildtrace.jsonl
```

Create an evidence-linked decision playbook across projects:

```bash
node bin/buildtrace.mjs playbook \
  --target /path/to/project-a \
  --target /path/to/project-b \
  --output /path/to/personal-decision-playbook.md
```

Only identical stable principle IDs aggregate. Conflicting wording remains visible for human review.

## Private, team, and public boards

Local viewing reads the complete private source. Sharing starts by generating a new derivative:

```bash
node bin/buildtrace.mjs publish --profile team --target /path/to/project --output /empty/team-site
node bin/buildtrace.mjs publish --profile public --target /path/to/project --output /empty/public-site
```

Legacy records default to `private`. The team profile includes only `team` and `public` records and removes internal paths. The public profile includes only explicitly public records and additionally removes original messages, Agent process, technical notes, and project resources before deployment. Client-side hiding is not a privacy boundary.

See [`docs/buildtrace/DEPLOY.md`](docs/buildtrace/DEPLOY.md) for hosting details.

## Boundaries

1. `BUILDTRACE.md` is the only editable source. JSON, the Viewer, indexes, and playbooks are rebuildable derivatives.
2. The Viewer is read-only. Browser storage and `nodes.json` never become project facts.
3. Evidence is required. An action preceding a metric change does not prove causality.

BuildTrace borrows validated problem and interaction patterns from [Cline Memory Bank](https://cline.bot/blog/memory-bank-how-to-make-cline-an-ai-agent-that-never-forgets), [Linear Projects / Updates](https://linear.app/docs/initiative-and-project-updates), [PostHog annotations](https://posthog.com/docs/user-guides/annotations), [Apache DevLake](https://devlake.apache.org/), [ONES](https://docs.ones.com/zh-Hans/get-started/quick-start-guide-to-ones-project), [TAPD](https://www.tapd.cn/home/solution/tapdlite), and the visual restraint of [amber.ac](https://amber.ac/). It does not copy their branding, code, or assets. See the full [inspiration and attribution ledger](docs/buildtrace/references/inspiration-and-attribution.md).

BuildTrace is still alpha. The CLI has not been published to npm, and cross-tool recovery remains limited by what each platform exposes or exports.

## License

BuildTrace is open source under the [MIT License](LICENSE).

Copyright © 2026 Yim leung.

This license applies to the BuildTrace repository itself. Running `init` or `sync` in another project does not change that project's existing license.
