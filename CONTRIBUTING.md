# Contributing to BuildTrace

BuildTrace is MIT-licensed. You may fork it, change the Skill, improve recovery, fix the Viewer, or propose new Agent adapters.

## If BuildTrace missed a meaningful record

Open an issue with a redacted minimal example:

- which Agent and version you used;
- whether the project was already initialized;
- the natural-language request;
- what meaningful outcome should have been recorded;
- what was recorded instead, or whether nothing was recorded;
- whether the relevant task/session was still accessible;
- expected privacy (`private`, `team`, or `public`).

Do not upload private `BUILDTRACE.md`, `.buildtrace/recovery/`, local paths, tokens, private URLs, or full transcripts unless you have deliberately redacted them.

## Change the extraction rule

The clean global Skill is [`skill/buildtrace/SKILL.md`](skill/buildtrace/SKILL.md). The full project rule copied by `init` is [`docs/buildtrace/SKILL.md`](docs/buildtrace/SKILL.md). Keep them aligned:

- global Skill: short activation and safety contract;
- project Skill: full schema, recovery, evidence, privacy, and review rules.

Add or update a deterministic test for every parser, CLI, recovery, publication, decision-playbook, or install behavior. Run:

```bash
npm test
npm run doctor
npm pack --dry-run
```

## Product boundary

Do not add another editable database, browser cache, or `nodes.json`. `docs/buildtrace/BUILDTRACE.md` remains the only project fact source. Do not make recovery claims for deleted, inaccessible, or never-exported conversations. Do not put maintainer or downstream-project archives in the clean Skill or public demo.

Before copying third-party code, assets, or schemas, check the exact license and preserve required notices. Acknowledging a product pattern is not the same as incorporating its code.
