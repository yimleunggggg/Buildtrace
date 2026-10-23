import { readdir, readFile, realpath, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { basename, dirname, join, resolve, sep } from "node:path";
import { parseBuildtrace } from "../viewer/parser.mjs";

const skipped = new Set([".git", "node_modules", ".buildtrace", ".cache", ".venv", "venv", "vendor", "Pods", ".next", ".turbo", "dist", "build", "_site"]);

export async function discoverProjects({ roots = [], knownProjects = [], sourceOverrides = {}, maxDepth = 14 } = {}) {
  const found = new Map();
  const visited = new Set();
  const coverage = { roots: [], unreadable: [], skippedSymlinks: [], depthLimited: [], gitWorktrees: [] };
  const add = (target, details = {}) => {
    const key = resolve(target);
    const prior = found.get(key) || {};
    found.set(key, { ...prior, target:key, ...details, evidence:[...new Set([...(prior.evidence || []), ...(details.evidence || [])])] });
  };
  for (const project of knownProjects) add(project.target, {label:project.label || basename(project.target), evidence:["registered-project"]});
  for (const [target, source] of Object.entries(sourceOverrides)) add(target, {source:resolve(source), explicitSource:true, evidence:["existing-source-override"]});

  async function walk(directory, depth = 0) {
    const absolute = resolve(directory);
    if (visited.has(absolute)) return;
    visited.add(absolute);
    let items;
    try { items = await readdir(absolute, {withFileTypes:true}); }
    catch (error) { coverage.unreadable.push({path:absolute, code:error.code}); return; }
    for (const item of items) {
      const path = join(absolute,item.name);
      if (item.isSymbolicLink()) { coverage.skippedSymlinks.push(path); continue; }
      if (item.isDirectory()) {
        if (skipped.has(item.name)) continue;
        if (depth >= maxDepth) { coverage.depthLimited.push(path); continue; }
        await walk(path,depth+1);
      } else if (item.isFile() && item.name === "BUILDTRACE.md") {
        if (basename(absolute) === "templates" || /(?:^|[\\/])node_modules(?:[\\/]|$)/.test(path)) continue;
        const standard = basename(absolute) === "buildtrace" && basename(dirname(absolute)) === "docs";
        const target = standard ? dirname(dirname(absolute)) : absolute;
        const existing = found.get(target);
        // Explicit sources (e.g. a private maintainer archive) win over demos.
        if (!existing?.explicitSource && (!existing?.source || standard)) add(target,{source:path, evidence:[standard?"project-archive":"standalone-archive"], standalone:!standard});
      } else if (item.isFile() && item.name === "AGENTS.md" && basename(absolute) !== "adapters") {
        let text;
        try { text = await readFile(path,"utf8"); } catch { continue; }
        if (/BuildTrace|buildtrace init|buildtrace:project-adapter/i.test(text)) {
          const nested = basename(absolute) === "buildtrace" && basename(dirname(absolute)) === "docs";
          add(nested ? dirname(dirname(absolute)) : absolute,{evidence:["project-rule"]});
        }
      }
    }
  }

  for (const directory of [...new Set([...roots, ...knownProjects.map(p=>p.target)])]) {
    coverage.roots.push(resolve(directory));
    await walk(directory);
  }
  // Follow Git's own list, including worktrees outside the selected parent folders.
  const gitGroups = new Set();
  for (const candidate of [...found.values()]) {
    const result = spawnSync("git",["-C",candidate.target,"rev-parse","--path-format=absolute","--git-common-dir"],{encoding:"utf8"});
    if (result.status !== 0) continue;
    const common = result.stdout.trim();
    if (gitGroups.has(common)) continue;
    gitGroups.add(common);
    const worktrees = spawnSync("git",["-C",candidate.target,"worktree","list","--porcelain","-z"],{encoding:"utf8"});
    if (worktrees.status !== 0) continue;
    for (const field of worktrees.stdout.split("\0")) if (field.startsWith("worktree ")) {
      const path = field.slice(9);
      coverage.gitWorktrees.push(path);
      add(path,{evidence:["git-worktree"], commonGitDir:common});
      await walk(path);
    }
  }

  const projects = [];
  const canonical = new Map();
  for (const candidate of found.values()) {
    let target;
    try { target = await realpath(candidate.target); } catch { coverage.unreadable.push({path:candidate.target,code:"unavailable-project"}); continue; }
    if (!candidate.source) {
      const standard = join(target,"docs/buildtrace/BUILDTRACE.md");
      if ((await stat(standard).catch(()=>null))?.isFile()) candidate.source = standard;
    }
    let source = null;
    if (candidate.source) try { source=await realpath(candidate.source); } catch { coverage.unreadable.push({path:candidate.source,code:"unavailable-source"}); }
    const key = source || target;
    if (canonical.has(key)) { canonical.get(key).aliases.push(candidate.target); continue; }
    let count = null, archiveTitle = "";
    if (source) try { const trace=parseBuildtrace(await readFile(source,"utf8")); count=trace.entries.length; archiveTitle=trace.title; } catch { /* Keep unreadable candidates visible. */ }
    const historical = /[\\/]Documents[\\/]Codex[\\/]|[\\/]outputs?[\\/]/.test(target);
    const worktree = /[\\/](?:\.codex|\.cursor)[\\/]worktrees[\\/]/.test(target) || (candidate.commonGitDir && resolve(candidate.commonGitDir)!==join(target,".git"));
    const kind = worktree ? "worktree" : historical ? "historical" : candidate.standalone ? "export" : source ? "project" : candidate.evidence.includes("project-rule") ? "rules-only" : "uninitialized";
    const row = {target, ...(source?{source}:{}), label:candidate.label || (archiveTitle && archiveTitle!=="BuildTrace" ? archiveTitle : basename(target)), archiveTitle, kind, count, evidence:candidate.evidence, aliases:[], ...(candidate.commonGitDir?{commonGitDir:candidate.commonGitDir}:{})};
    canonical.set(key,row);projects.push(row);
  }
  projects.sort((a,b)=>a.kind.localeCompare(b.kind)||a.label.localeCompare(b.label,"zh-CN"));
  return {schemaVersion:1, generatedAt:new Date().toISOString(), note:"Discovery is limited to the listed roots, registered paths and visible Git worktrees. No archives were initialized, rewritten or merged.", coverage, projects};
}
