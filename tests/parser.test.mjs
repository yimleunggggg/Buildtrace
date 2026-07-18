import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getBuildtraceStats, parseBuildtrace } from "../docs/buildtrace/viewer/parser.js";

const source = await readFile(new URL("../docs/buildtrace/BUILDTRACE.md", import.meta.url), "utf8");

test("parses project intent and records from BUILDTRACE.md", () => {
  const trace = parseBuildtrace(source);

  assert.equal(trace.title, "BuildTrace");
  assert.equal(trace.principles.length, 5);
  assert.equal(trace.entries.length, 3);
  assert.equal(trace.entries[0].date, "2026-07-18");
  assert.equal(trace.entries[0].sourceTrust, "confirmed");
  assert.equal(trace.entries[0].status, "待观察");
  assert.match(trace.entries[0].sections.why, /旧版界面/);
  assert.match(trace.entries[1].sections.result, /判断有效/);
});

test("computes status and review signals", () => {
  const trace = parseBuildtrace(source);
  const stats = getBuildtraceStats(trace.entries, new Date("2026-07-26T12:00:00"));

  assert.deepEqual(stats, {
    total: 3,
    pending: 1,
    effective: 2,
    due: 1,
    nextReview: "2026-07-25",
  });
});

test("rejects non-string sources", () => {
  assert.throws(() => parseBuildtrace(null), /must be a string/);
});

test("assigns distinct IDs to duplicate record titles", () => {
  const duplicate = `# Duplicate\n\n## 项目初心\n\n- 为什么做这个项目: test\n\n## 项目记录\n\n### 2026-07-18 — Same title\n\n### 2026-07-18 — Same title\n`;
  const trace = parseBuildtrace(duplicate);

  assert.equal(trace.entries.length, 2);
  assert.notEqual(trace.entries[0].id, trace.entries[1].id);
});
