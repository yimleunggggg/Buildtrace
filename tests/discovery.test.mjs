import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, realpath, symlink, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { discoverProjects } from "../docs/buildtrace/scripts/discover-projects.mjs";
import { parseBuildtrace } from "../docs/buildtrace/viewer/parser.mjs";

test("discovery distinguishes archives, rules, registered candidates and historical copies without initialization", async()=>{
  const root=await realpath(await mkdtemp(join(tmpdir(),"buildtrace-discover-")));
  try {
    const project=join(root,"product"), rules=join(root,"rules"), unknown=join(root,"new"), old=join(root,"Documents/Codex/old");
    for(const p of [project,old]){await mkdir(join(p,"docs/buildtrace"),{recursive:true});await writeFile(join(p,"docs/buildtrace/BUILDTRACE.md"),"# Archive\n### 2026-10-23 — One\n做了什么:\n- Made a thing\n");}
    await mkdir(rules);await writeFile(join(rules,"AGENTS.md"),"Use BuildTrace project memory.\n");await mkdir(unknown);
    await mkdir(join(root,"node_modules/fake/docs/buildtrace"),{recursive:true});await writeFile(join(root,"node_modules/fake/docs/buildtrace/BUILDTRACE.md"),"# Dependency\n");
    await symlink(project,join(root,"alias"),"dir");
    await writeFile(join(project,"private.md"),"# Real project\n### 2026-10-23 — Private\n");
    const original=await readFile(join(project,"docs/buildtrace/BUILDTRACE.md"),"utf8");
    const report=await discoverProjects({roots:[root],knownProjects:[{target:unknown,label:"Unstarted"}],sourceOverrides:{[project]:join(project,"private.md")}});
    assert.equal(report.projects.length,4);
    assert.equal(report.projects.find(p=>p.target===project).source,join(project,"private.md"));
    assert.equal(report.projects.find(p=>p.target===rules).kind,"rules-only");
    assert.equal(report.projects.find(p=>p.target===unknown).kind,"uninitialized");
    assert.equal(report.projects.find(p=>p.target===old).kind,"historical");
    assert.ok(report.coverage.skippedSymlinks.includes(join(root,"alias")));
    await assert.rejects(readFile(join(unknown,"docs/buildtrace/BUILDTRACE.md")),/ENOENT/);
    assert.equal(await readFile(join(project,"docs/buildtrace/BUILDTRACE.md"),"utf8"),original);
  }finally{await rm(root,{recursive:true,force:true});}
});

test("discovery follows Git's registered worktrees outside the scan root",async()=>{
  const root=await realpath(await mkdtemp(join(tmpdir(),"buildtrace-discover-git-")));
  const main=join(root,"main"),linked=join(root,"outside");
  try{
    const git=(...args)=>{const r=spawnSync("git",args,{encoding:"utf8"});assert.equal(r.status,0,r.stderr);};
    git("init",main);git("-C",main,"-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--allow-empty","-m","initial");git("-C",main,"worktree","add","--detach",linked);
    await mkdir(join(main,"docs/buildtrace"),{recursive:true});await writeFile(join(main,"docs/buildtrace/BUILDTRACE.md"),"# Main\n");
    const report=await discoverProjects({roots:[main]});
    assert.ok(report.projects.find(p=>p.target===linked&&p.kind==="worktree"));
    assert.ok(report.coverage.gitWorktrees.includes(linked));
  }finally{await rm(root,{recursive:true,force:true});}
});

test("old dated notes are visible without inventing user quotes or contemporaneous plans",()=>{
  const raw="# Old notes\n\n## 2026-07-08 MVP\n- Original note\n\n## 下一步\n- Future work\n\n## 2026-07-13 Trace Skills\n- More work\n";
  const trace=parseBuildtrace(raw);
  assert.equal(trace.entries.length,2);
  assert.equal(trace.entries[0].legacyFormat,"dated-notes");
  assert.equal(trace.entries[0].sections.changes,"Original note");
  assert.equal(trace.entries[0].quotes.length,0);
  assert.equal(trace.entries[0].sourceTrust,"unknown");
  assert.equal(trace.entries[0].sections.agentPlan,"");
  assert.doesNotMatch(trace.entries[0].sections.changes,/Future work/);
});
