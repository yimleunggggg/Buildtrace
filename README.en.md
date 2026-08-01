# BuildTrace

[简体中文](README.md) · [English](README.en.md)

BuildTrace keeps the part of an AI-assisted project that is easiest to lose: why a person made a decision, how an Agent interpreted and carried it out, what changed afterwards, and whether the original judgment held up.

Current release: `v1.18.0-alpha.1`

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

## Install once, initialize each project

Requires Node.js 20 or later.

```bash
npm install -g github:yimleunggggg/Buildtrace && buildtrace setup
```

This installs a clean, rule-only Skill and idempotent user-level auto-activation instructions for Codex, Cursor, Claude Code, GitHub Copilot, Windsurf, and Gemini CLI. The global Skill contains no `BUILDTRACE.md` and no maintainer or downstream-project archive.

Run the same command again to upgrade a GitHub installation. Contributors who clone this repository and run `node bin/buildtrace.mjs setup` get live links to the checkout, so edits to the repository's clean Skill appear locally without another copy step.

The user-level Skill becomes discoverable from every repository, but BuildTrace does **not** silently modify every project. Initialize each project once so it gets its own source, project instructions, recovery manifest, and Viewer:

```bash
buildtrace init --target /path/to/your-project
```

Update an installed project from the latest BuildTrace checkout:

```bash
node bin/buildtrace.mjs sync --target /path/to/your-project
```

`sync` updates managed Viewer, Skill, CLI, reference, and deployment files after backing up the previous copies. It does not rewrite the project's `BUILDTRACE.md` or `AGENTS.md`.

## Everyday use

Once the project instructions are active, no fixed command is required. Speak normally:

> Prioritize Japanese search indexing for now. Review impressions and clicks in two weeks before changing conversion.

> This result did not improve anything. Update the original record and mark the hypothesis as refuted.

> Restore why this project chose the current data structure before changing it.

Before meaningful work, the Agent reads the purpose, related history, recent records, and due reviews. After a meaningful feature, fix, decision, release, or operation, it writes the conversation, interpretation, plan, execution, and verification back in the same turn.

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
