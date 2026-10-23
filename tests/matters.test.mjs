import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import test from "node:test";
import { parseBuildtrace } from "../docs/buildtrace/viewer/parser.mjs";
import { recordReading, relatedMatterRecords, buildContextMarkdown } from "../docs/buildtrace/viewer/reading-model.mjs";
import { buildPublication } from "../docs/buildtrace/scripts/derive-views.mjs";

const cli = new URL("../bin/buildtrace.mjs", import.meta.url).pathname;
const source = `# Fixture\n\n## 项目初心\n- 为什么做这个项目: Preserve context\n\n## 项目记录\n### 2026-10-23 — Header date is not occurrence\n记录 ID: bt-later\n记录结构: 事项记录\n事项 ID: matter-search\n阶段: 检查\n发生时间: 2026-10-12\n补录时间: 2026-10-23\n来源可信度: confirmed\n来源覆盖: test\n依据: test source\n场景: decision\n可见范围: public\n结果状态: 不确定\n后续回看: 无\n自定义字段: untouched\n事项概览:\n- **缩短搜索路径**，尚待用户确认。\n需求要点:\n- [R1 <- Q1] 手机先找到搜索。\n沟通原文:\n- [Q1 | user | fixture:L1 | verbatim]\n  > 手机先找到搜索，不要删除完整说明。\n讨论过程:\n- [T2 | 日期=2026-10-12T10:00:00+08:00 | 类型=计划 | 引用=Q1 | 来源=fixture:L2] 先改页面，再检查。\n- [T1 | 日期=2026-10-12T09:00:00+08:00 | 类型=理解 | 来源=fixture:L1] 说明保留但折叠。\n实际执行:\n- [E1 <- T2 | completed] 修改页面。\n交付与检查:\n- 页面已生成，尚未取得用户确认。\n后来反馈:\n- 还没有使用数据。\n研究附件:\n- 自定义扩展不能丢。\n\n### 2026-10-01 — Same category, different matter\n记录 ID: bt-unrelated\n事项 ID: matter-payments\n场景: decision\n需求总结:\n- 支付改动\n\n### 2026-10-01 — Earlier record in the same matter\n记录 ID: bt-earlier\n事项 ID: matter-search\n场景: architecture\n需求总结:\n- 原搜索方案\n`;

test("matter identity survives phases/categories and extension fields remain available", () => {
  const trace = parseBuildtrace(source);
  const entry = trace.entries[0];
  assert.equal(entry.matterId, "matter-search");
  assert.equal(entry.phase, "检查");
  assert.equal(entry.extraFields["自定义字段"], "untouched");
  assert.equal(entry.extraSections["研究附件"].items[0], "自定义扩展不能丢。");
  assert.deepEqual(relatedMatterRecords(trace.entries, entry).map((r) => r.recordId), ["bt-earlier"]);
  assert.deepEqual(recordReading(entry).process.map((e) => e.id), ["T1", "T2"]);
  assert.equal(entry.discussion[0].id, "T2");
  assert.match(recordReading(entry).delivery[0], /尚未取得用户确认/);
  assert.equal(entry.outcomes.length, 0);
  const publicTrace = parseBuildtrace(buildPublication(trace, "public").markdown);
  assert.match(publicTrace.entries[0].sections.delivery, /尚未取得用户确认/);
  assert.equal(publicTrace.entries[0].discussion.length, 0);
  assert.equal(publicTrace.entries[0].quotes.length, 0);
});

test("context projection keeps uncertainty and excludes unconfirmed personal principles", () => {
  const trace = parseBuildtrace(source);
  trace.decisionPrinciples = [{text:"Invented preference", confirmation:"agent-inferred", sourceTrust:"confirmed", evidence:"test"}];
  for (const mode of ["handoff", "claude-memory", "langchain-md"]) {
    const text = buildContextMarkdown(trace, {mode, sourceHash:"abc", generatedAt:"fixture"});
    assert.match(text, /尚未取得用户确认/);
    assert.match(text, /不是新的执行授权/);
    assert.doesNotMatch(text, /Invented preference/);
    assert.match(text, /abc/);
  }
  const mixed = parseBuildtrace(source).entries[0];
  delete mixed.discussion[0].date;
  assert.deepEqual(recordReading(mixed).process.map((e) => e.id), ["T2", "T1"]);
  const selected = buildContextMarkdown(trace, {recordIds:["bt-earlier"]});
  assert.match(selected, /展开 1\/3/);
  assert.doesNotMatch(selected, /先改页面，再检查/);
  assert.match(selected, /其他历史索引/);
});

test("quoted HTML comments are human evidence, not template comments", () => {
  const trace = parseBuildtrace("# Quote\n### 2026-10-23 — Code\n沟通原文:\n- [Q1 | user | fixture | verbatim]\n  > 请保留 <!-- human comment -->\n  > 这是原话\n");
  assert.equal(trace.entries[0].quotes[0].text, "请保留 <!-- human comment -->\n这是原话");
});

test("exact cross-field repeats are moved out of primary reading without deleting source text", () => {
  const entry={sectionItems:{summary:["[R1 <- Q1] 保留说明"],why:["保留说明"],changes:["已生成文件"],result:["已生成文件"]}};
  const view=recordReading(entry);
  assert.deepEqual(view.background,[]);
  assert.deepEqual(view.delivery,[]);
  assert.deepEqual(view.repeated.delivery,["已生成文件"]);
  assert.equal(entry.sectionItems.why[0],"保留说明");
});

test("exports respect source override, bundles preserve bytes and sync check does not write", async () => {
  const target = await mkdtemp(join(tmpdir(), "buildtrace-matters-"));
  const run = (...args) => spawnSync(process.execPath, [cli, ...args, "--target", target], {encoding:"utf8"});
  try {
    await mkdir(join(target, "docs/buildtrace"), {recursive:true});
    await writeFile(join(target, "docs/buildtrace/BUILDTRACE.md"), "# Public demo\n");
    await writeFile(join(target, "private.md"), source);
    await writeFile(join(target, "docs/buildtrace/PROJECT-RULES.md"), "Custom stages and preferences\n");
    const check = run("sync", "--check");
    assert.equal(check.status, 0, check.stderr);
    await assert.rejects(readFile(join(target, "docs/buildtrace/SKILL.md")), /ENOENT/);
    assert.equal(run("sync").status, 0);
    assert.equal(await readFile(join(target, "docs/buildtrace/PROJECT-RULES.md"), "utf8"), "Custom stages and preferences\n");
    await writeFile(join(target, "valid-private.md"), source.split("\n### 2026-10-01")[0]);
    const doctor = run("doctor", "--source", join(target, "valid-private.md"));
    assert.equal(doctor.status, 0, doctor.stderr);
    const bundle = join(target, "bundle");
    const result = run("export", "--source", join(target,"private.md"), "--format", "bundle", "--output", bundle);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(await readFile(join(bundle, "BUILDTRACE.md"), "utf8"), source);
    const manifest = JSON.parse(await readFile(join(bundle,"MANIFEST.json"),"utf8"));
    assert.equal(manifest.sha256, createHash("sha256").update(source).digest("hex"));
    assert.notEqual(run("export", "--format", "bundle", "--output", bundle).status, 0);
    const exported = run("export", "--source", join(target,"private.md"), "--format", "handoff");
    assert.equal(exported.status, 0, exported.stderr);
    assert.match(exported.stdout, /matter-search/);
    assert.doesNotMatch(exported.stdout, /Public demo/);
  } finally { await rm(target, {recursive:true, force:true}); }
});
