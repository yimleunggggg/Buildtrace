import { readFile, realpath } from "node:fs/promises";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { parseBuildtrace, sortRecords } from "../viewer/parser.mjs";

const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BuildTrace · 本地项目</title><style>body{font:17px/1.65 system-ui,sans-serif;background:#f4f5f1;color:#18221a;margin:0;padding:clamp(20px,5vw,64px)}main{max-width:1000px;margin:auto}h1{font-size:clamp(28px,4vw,44px)}article{background:white;border:1px solid #ccd3ca;border-radius:12px;padding:24px;margin:20px 0;overflow-wrap:anywhere}a{color:#21603b}p{margin:.5em 0}small{color:#4d5e51}button,a{min-height:44px}#error{color:#9c3027}</style><main><h1>本地项目</h1><p>查看各项目最近保存的进展，进入项目看板继续阅读。</p><small>每 10 秒读取所选档案；仅本机服务运行期间可用。没有扫描其他文件夹。</small><p id="error" role="status"></p><div id="projects"></div></main><script type="module">
const container=document.querySelector('#projects');
async function refresh(){try{const response=await fetch('/projects.json',{cache:'no-store'});if(!response.ok)throw Error('读取失败');const rows=await response.json();container.replaceChildren();for(const row of rows){const article=document.createElement('article');const heading=document.createElement('h2');heading.textContent=row.title;const link=document.createElement('a');link.href=row.url;link.textContent='打开项目看板 →';const note=document.createElement('p');note.textContent=row.error||row.count+' 条记录 · '+(row.latest||'暂无记录');const path=document.createElement('small');path.textContent=row.root;article.append(heading,note,link,document.createElement('br'),path);container.append(article)}document.querySelector('#error').textContent=''}catch{document.querySelector('#error').textContent='暂时无法更新。请检查本地服务是否仍在运行。'}}await refresh();setInterval(()=>{if(!document.hidden)refresh()},10000);
</script></html>`;

export async function serveOverview({ projects, port, cli }) {
  if (!projects.length) throw new Error("overview requires --target or --project-list");
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("invalid overview port");
  const workers = [];
  try {
    const selected = [];
    for (const project of projects) {
      const root = await realpath(resolve(project.target));
      const source = resolve(project.source || join(root, "docs/buildtrace/BUILDTRACE.md"));
      // Validate all requested sources before launching any worker.
      parseBuildtrace(await readFile(source, "utf8"));
      selected.push({ root, source });
    }
    for (const project of selected) {
      const child = spawn(process.execPath, [cli, "serve", "--target", project.root, "--source", project.source, "--port", "0"], {stdio:["ignore","pipe","pipe"]});
      workers.push(child);
      project.url = await new Promise((done, fail) => {
        let output = "";
        const timer = setTimeout(() => fail(new Error("project viewer startup timed out")), 10000);
        child.stdout.on("data", (chunk) => {
          output += chunk;
          const match = output.match(/BuildTrace Viewer: (http:\/\/localhost:\d+)/);
          if (match) { clearTimeout(timer); done(`${match[1]}/docs/buildtrace/viewer/`); }
        });
        child.stderr.on("data", (chunk) => { output += chunk; });
        child.once("error", (error) => { clearTimeout(timer); fail(error); });
        child.once("exit", () => { clearTimeout(timer); fail(new Error(`project viewer stopped: ${output}`)); });
      });
    }
    const server = createServer(async (request, response) => {
      if (request.url === "/projects.json") {
        const rows = await Promise.all(selected.map(async (p) => {
          try {
            const trace = parseBuildtrace(await readFile(p.source, "utf8"));
            const latest = sortRecords(trace.entries)[0];
            return {title:trace.title, root:p.root, url:p.url, count:trace.entries.length, latest:latest ? `${latest.date} · ${latest.title}` : ""};
          } catch { return {title:p.root, root:p.root, url:p.url, error:"档案暂时不可读"}; }
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
