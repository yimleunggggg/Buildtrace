import { readFile, realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { parseBuildtrace, sortRecords } from "../viewer/parser.mjs";

const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BuildTrace · 本地项目</title><style>body{font:17px/1.65 system-ui,sans-serif;background:#f4f5f1;color:#18221a;margin:0;padding:clamp(20px,5vw,64px)}main{max-width:1000px;margin:auto}h1{font-size:clamp(28px,4vw,44px)}article{background:white;border:1px solid #ccd3ca;border-radius:12px;padding:24px;margin:20px 0;overflow-wrap:anywhere}a{color:#21603b}p{margin:.5em 0}small{color:#4d5e51}button,a{min-height:44px}#error{color:#9c3027}</style><main><h1>本地项目</h1><p>查看各项目最近保存的进展，进入项目看板继续阅读。</p><small>每 10 秒读取所选档案；仅本机服务运行期间可用。范围以此页清单及发现报告为准，不代表整台电脑的所有项目。</small><p id="error" role="status"></p><div id="projects"></div></main><script type="module">
const container=document.querySelector('#projects');
const labels={project:'项目档案',historical:'历史位置',worktree:'工作树',export:'独立档案或导出', 'rules-only':'仅发现规则',uninitialized:'已登记，未发现档案'};
async function refresh(){try{const response=await fetch('/projects.json',{cache:'no-store'});if(!response.ok)throw Error('读取失败');const rows=await response.json();const scope=await(await fetch('/scope.json',{cache:'no-store'})).json();document.querySelector('h1').textContent=scope.discovered?'已发现的项目与档案':'已选择的本地项目';let note=document.querySelector('#scope');if(!note){note=document.createElement('details');note.id='scope';container.before(note)}note.replaceChildren();const summary=document.createElement('summary');summary.textContent=rows.length+' 个位置 · '+rows.filter(r=>r.count!==null).length+' 份可读档案 · 查看查找范围';note.append(summary);const detail=document.createElement('p');detail.textContent=scope.discovered?'本次查找覆盖下列目录、已登记项目和可见 Git 工作树；不能据此断言电脑上只有这些。':'这是手动选择清单，不是全机项目数量。';note.append(detail);for(const root of scope.roots||[]){const path=document.createElement('small');path.textContent=root;note.append(path,document.createElement('br'))}if(scope.gaps){const gap=document.createElement('p');gap.textContent=scope.gaps+' 处不可读、跳过的符号链接或深度限制，详见发现报告。';note.append(gap)}container.replaceChildren();for(const row of rows){const article=document.createElement('article');const type=document.createElement('small');type.textContent=labels[row.kind]||labels.project;const heading=document.createElement('h2');heading.textContent=row.title;const link=document.createElement('a');if(row.url)link.href=row.url;link.textContent=row.url?(row.count===0?'查看原档案 →':'打开项目看板 →'):'未发现可读档案，未自动初始化';const note=document.createElement('p');note.textContent=row.error||(row.count===null?'有项目路径，尚不能证明已开始记录':row.count===0?'档案存在，当前格式未识别到记录':row.count+' 条已识别记录 · '+(row.latest||''));const path=document.createElement('small');path.textContent=row.root;article.append(type,heading,note,link,document.createElement('br'),path);if(row.aliases?.length){const alias=document.createElement('p');alias.textContent='同一路径别名：'+row.aliases.join('、');article.append(alias)}container.append(article)}document.querySelector('#error').textContent=''}catch{document.querySelector('#error').textContent='暂时无法更新。请检查本地服务是否仍在运行。'}}await refresh();setInterval(()=>{if(!document.hidden)refresh()},10000);
</script></html>`;

export async function serveOverview({ projects, coverage = null, port, cli }) {
  if (!projects.length) throw new Error("overview requires --target or --project-list");
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("invalid overview port");
  const workers = [];
  const started = new Map();
  try {
    const selected = [];
    for (const project of projects) {
      const root = await realpath(resolve(project.target)).catch(()=>resolve(project.target));
      const candidate = resolve(project.source || join(root, "docs/buildtrace/BUILDTRACE.md"));
      const source = (await stat(candidate).catch(()=>null))?.isFile() ? candidate : null;
      selected.push({ ...project, root, source });
    }
    const startProject = (project) => {
      const key=JSON.stringify([project.root,project.source]);
      if (started.has(key)) return started.get(key);
      const child = spawn(process.execPath, [cli, "serve", "--target", project.root, "--source", project.source, "--port", "0", "--read-only", "--shared-viewer"], {stdio:["ignore","pipe","pipe"]});
      workers.push(child);
      const ready = new Promise((done, fail) => {
        let output = "";
        const timer = setTimeout(() => fail(new Error("project viewer startup timed out")), 10000);
        child.stdout.on("data", (chunk) => {
          output += chunk;
          const match = output.match(/BuildTrace Viewer: (http:\/\/localhost:\d+)/);
          if (match) { clearTimeout(timer); done(`${match[1]}/docs/buildtrace/viewer/`); }
        });
        child.stderr.on("data", (chunk) => { output += chunk; });
        child.once("error", (error) => { clearTimeout(timer); fail(error); });
        child.once("exit", () => { clearTimeout(timer); started.delete(key); fail(new Error(`project viewer stopped: ${output}`)); });
      });
      started.set(key,ready);
      ready.catch(()=>started.delete(key));
      return ready;
    };
    const server = createServer(async (request, response) => {
      const url=new URL(request.url || "/","http://localhost");
      if (url.pathname === "/open") {
        const id=Number(url.searchParams.get("id"));
        const project=Number.isInteger(id) && url.searchParams.has("id") ? selected[id] : null;
        if (!project?.source) {response.writeHead(404);response.end("Archive not found; no project was initialized.");return;}
        try {
          const viewer=await startProject(project);
          const destination=url.searchParams.get("raw")==="1"?new URL("/docs/buildtrace/BUILDTRACE.md",viewer).href:viewer;
          response.writeHead(302,{Location:destination});response.end();
        } catch { response.writeHead(503,{"Content-Type":"text/plain; charset=utf-8"});response.end("Project viewer could not start. Check the archive path and retry."); }
      } else if (url.pathname === "/scope.json") {
        response.writeHead(200,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});
        response.end(JSON.stringify({discovered:Boolean(coverage),roots:coverage?.roots || selected.map(p=>p.root),gaps:coverage?((coverage.unreadable?.length||0)+(coverage.depthLimited?.length||0)+(coverage.skippedSymlinks?.length||0)):0}));
      } else if (url.pathname === "/projects.json") {
        const rows = await Promise.all(selected.map(async (p,index) => {
          const base={title:p.label||p.root,root:p.root,kind:p.kind||"project",aliases:p.aliases||[],url:"",count:null};
          if (!p.source) return {...base,kind:p.kind||"uninitialized"};
          try {
            const trace = parseBuildtrace(await readFile(p.source, "utf8"));
            const latest = sortRecords(trace.entries)[0];
            return {...base,title:p.label||trace.title,url:`http://localhost:${server.address().port}/open?id=${index}${trace.entries.length?"":"&raw=1"}`,count:trace.entries.length,latest:latest ? `${latest.occurredAt||latest.date} · ${latest.title}` : ""};
          } catch { return {...base,error:"档案暂时不可读"}; }
        }));
        response.writeHead(200, {"Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store"});
        response.end(JSON.stringify(rows));
      } else if (request.url === "/") {
        response.writeHead(200, {"Content-Type":"text/html; charset=utf-8", "Cache-Control":"no-store"});
        response.end(html);
      } else { response.writeHead(404); response.end("Not found"); }
    });
    await new Promise((done, fail) => { server.once("error", fail); server.listen(port,"127.0.0.1",done); });
    console.log(`BuildTrace Overview: http://localhost:${server.address().port}`);
    const close = () => { for (const child of workers) child.kill("SIGTERM"); server.close(() => process.exit(0)); };
    process.once("SIGTERM",close);
    process.once("SIGINT",close);
    process.once("exit", () => { for (const child of workers) child.kill("SIGTERM"); });
  } catch (error) { for (const child of workers) child.kill("SIGTERM"); throw error; }
}
