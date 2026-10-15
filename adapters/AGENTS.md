# BuildTrace project memory

Do not wait for fixed commands such as `Record this session`. Extract intent, concerns, tradeoffs, evidence, and outcomes from the user's ordinary natural language. Before meaningful work, restore the relevant project context automatically. After a meaningful change or decision is completed, update the project record in the same turn and ask only about missing information that would change the factual judgment.

Read `docs/buildtrace/SKILL.md` when meaningful project work begins or ends, when restoring context, backfilling history, reviewing outcomes, or correcting an existing record.

Respect project-specific source-path overrides. After saving, re-read the record or run `buildtrace status --target .`, then give the record title, ID and file location. Do not claim the session was recorded just because rules were loaded or init ran.

Before editing an existing archive, run `buildtrace snapshot --target .`; afterwards run `buildtrace verify-history --target .`. Existing quotes and reasoning are append-only evidence; corrections add dated evidence instead of silently rewriting history.

On first installation or historical backfill, run the recovery audit and exhaust every safe matching task page, local rollout, compact marker, fork or subagent edge, Git branch, project artifact, and authorized export. Report inaccessible sources instead of claiming complete recovery.

The default project-memory source is `docs/buildtrace/BUILDTRACE.md`; use an explicit project source override when provided. Do not create `nodes.json` or use Viewer state as a second source. Every factual entry requires evidence. Preserve every relevant user message in full, itemize the Agent's contemporaneous understanding, and keep the original plan separate from the actual execution trace.

Before designing a substantial capability, check first-party evidence for mature products, standards, or open-source projects that already validate the user need. Prefer linking, importing, API integration, open structures, or licensed reuse over rebuilding generic infrastructure. Record what pattern was adopted and why anything project-specific still needs to be built. If third-party code, assets, or schemas are incorporated, review and preserve the required license and copyright notices; a thank-you line is not license compliance.
