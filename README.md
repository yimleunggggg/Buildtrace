# BuildTrace

BuildTrace 是给人和 AI Agent 共用的项目因果记忆。它不替代 Git，也不把每个提交写成日志；它保存真正容易丢失的部分：为什么做、做了什么、依据在哪里，以及后来有没有效果。

当前版本：`v1.15.0-alpha.1`

## 5 分钟开始

要求：Node.js 20 或更高版本。

```bash
npm install
npm run doctor
npm run serve
```

浏览器打开 `http://localhost:4173`。Viewer 只读解析 [`docs/buildtrace/BUILDTRACE.md`](docs/buildtrace/BUILDTRACE.md)，不会创建 `nodes.json`，也不会把浏览器缓存当作项目事实。

日常和 Agent 协作时，只需要说：

- `恢复上下文`：读取项目初心、最近记录和到期待回看的事项。
- `记录本轮`：把本轮意图、改动、证据和后续观察写进 Markdown。
- `修正「记录标题」`：纠正事实、原文或判断。
- `结果有效 / 无效 / 不确定`：完成一次结果回看。

## 安装到另一个项目

当前仓库内可直接运行：

```bash
node bin/buildtrace.mjs init --target /path/to/project
```

安装器会创建：

```text
docs/buildtrace/BUILDTRACE.md
docs/buildtrace/SKILL.md
docs/buildtrace/viewer/
bin/buildtrace.mjs
.cursor/rules/buildtrace.mdc
AGENTS.md
```

已有文件不会被覆盖。如果目标已有 `AGENTS.md`，安装器会生成 `AGENTS.md.buildtrace` 并提示手动合并。安装后在目标项目运行：

```bash
node docs/buildtrace/viewer/serve.mjs
```

## 三条产品边界

1. `BUILDTRACE.md` 是唯一主数据源。
2. Agent 负责修改，Viewer 只负责阅读、搜索和筛选。
3. 没有依据的内容不能写成事实；跨工具历史只能在仍有文件、导出或原文时恢复。

## 开发命令

```bash
npm test
npm run doctor
npm run serve
```

## 项目结构

```text
docs/buildtrace/BUILDTRACE.md   项目记忆主源
docs/buildtrace/SKILL.md        Agent 工作规则
docs/buildtrace/viewer/         只读 Viewer
bin/buildtrace.mjs              init / serve / doctor
tests/                          解析器与 CLI 测试
```

## 当前限制

- BuildTrace 不会自动读取不可访问的 Cursor、Claude、ChatGPT 历史。
- Viewer 需要通过本地服务器打开，直接双击 HTML 会受到浏览器文件访问限制。
- `init` 目前是仓库内 CLI；发布到 npm 后才可直接使用 `npx buildtrace init`。
