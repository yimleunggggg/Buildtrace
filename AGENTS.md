# BuildTrace repository instructions

This repository keeps the maintainer's real project memory in the Git-ignored `.buildtrace/private-self/BUILDTRACE.md`. The tracked `docs/buildtrace/BUILDTRACE.md` is synthetic public demo data and must never receive maintainer or user records.

Before meaningful work, read the private source when it exists: project purpose, latest records, relevant records, and due follow-ups. After a meaningful feature, fix, design change, architecture change, release, or important decision, update the private Markdown record according to `docs/buildtrace/SKILL.md`. In a public clone without that private file, do not treat the synthetic demo as project history.

Before editing an existing archive, save a local content-hash snapshot. For this repository use `node bin/buildtrace.mjs snapshot --target . --source .buildtrace/private-self/BUILDTRACE.md`; after editing, run the matching `verify-history` command. Existing quotes, interpretations, plans, and execution text are append-only evidence. Add dated corrections with new evidence instead of silently rewriting the prior account.

Do not wait for fixed commands. Extract intent, concerns, tradeoffs, evidence, and outcomes from the user's ordinary natural language; restore relevant context automatically before meaningful work and record completed meaningful work in the same turn.

The Viewer is a read-only derivative. Never introduce `nodes.json`, browser editing, or browser cache as a project-memory source.

Before designing a substantial new capability, check first-party evidence for mature products, standards, or open-source projects that already validate the need. Prefer linking, importing, integrating, or licensed reuse over rebuilding generic infrastructure. Record the adopted pattern and BuildTrace-specific difference; review licenses before incorporating third-party code, assets, or schemas.
