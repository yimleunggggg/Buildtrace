# BuildTrace

[简体中文](README.md) · [English](README.en.md)

BuildTrace 帮你记住和 AI 做项目时的原话、决定和实际进展。换工具或隔几周回来，还能找到当时为什么这样做，以及后来有没有效果。

当前版本：`v1.18.0-alpha.1`

## 第一次用，照这三步

**1. 发给能访问项目文件和终端的编程 AI：**

> 请从 https://github.com/yimleunggggg/Buildtrace 安装 BuildTrace，并运行 setup，让以后进入的项目按规则自动启用。保留我已有的工具配置。安装后在当前项目完成一次记录，告诉我记录标题、ID、文件位置和看板地址。

如果你习惯用终端，需要 Node.js 20 或更高版本：

```bash
npm install -g git+https://github.com/yimleunggggg/Buildtrace.git && buildtrace setup
```

然后重新打开 AI 工具或开始新会话，让它读到新规则。

**2. 进入一个项目，照常开始工作。** 第一次也可以说：

> 为这个项目启用 BuildTrace，先找回能读取的历史，再继续工作。完成后保存这次原话、决定和实际步骤，给我记录位置。

比如：“我担心首页太复杂，先简化搜索，两周后看使用情况。”你不用填表。AI 按规则记录重要工作；小修边合并到相关记录。已有项目的历史只恢复能核对的部分，缺失的原话会标明。

**3. 看一眼有没有真的记下。** AI 应给出记录标题、ID 和文件位置。想自己检查或打开看板，在项目文件夹运行：

```bash
buildtrace status --target .
buildtrace serve --target .
```

在浏览器打开 `serve` 打印的地址；终端要保持运行。以后也可以直接告诉 AI：“打开这个项目的 BuildTrace 看板。”本地地址只在这台电脑上有效；其他设备的访问方式见[部署说明](docs/buildtrace/DEPLOY.md)。

目前的自动记录由正在工作的 AI 执行，尚无后台程序保证捕获每轮对话。`status` 只核对已保存文件；“规则已加载”不等于“本轮已记录”。

## 我为什么做它

我不是工程师，做过多年用户运营、社区和线下活动。最近用 AI 做了几个从自己兴趣出发的小产品，也越来越频繁地遇到同一个问题：代码改得很快，项目却很容易“失忆”。

Git 能告诉我改了哪些文件，Agent 能总结这一轮完成了什么。但几周后再看数据，我常常想不起当时为什么改、基于什么判断、期待什么发生，以及后来到底有没有发生。真正容易丢的，往往是这样的原话：

> 我觉得 Bing 来的用户大概率是日语意图。
>
> 这个阶段先不管转化，先让页面被索引到。

所以我做了 BuildTrace：把人的原话和假设、Agent 当时的理解与执行，以及后来的数据和反馈，连成一条可以回看的记录。Git 记录项目变成了什么，BuildTrace 记录它为什么变成这样，以及当初的判断后来是否成立。

[阅读全文：《AI 写代码越来越快，但不理解你为什么这么想，我想把“人的判断”留下来》](https://mp.weixin.qq.com/s/OBF-aNReio1grgVbTYSYzg)。仓库内另有一份[简版自述](docs/INTRODUCTION.zh-CN.md)；如果要把整个产品一次性交给新的 Agent 或协作者，可以直接发送[《BuildTrace：产品与实现全景说明》](docs/PRODUCT-AND-IMPLEMENTATION.zh-CN.md)。

## 它留下什么

```text
人的原话与假设
        ↓
Agent 当时的理解与计划
        ↓
实际做了什么
        ↓
数据或外部事实如何变化
        ↓
后来回看：成立、没成立，还是暂时无法判断
```

主数据是一份项目内的 Markdown 文件：`docs/buildtrace/BUILDTRACE.md`。本仓库中的[同名文件](docs/buildtrace/BUILDTRACE.md)只是明确标注的虚构演示，不是维护者或其他项目的档案。Agent 负责从自然对话和实际工作中记录，Viewer 只负责阅读、搜索和复盘。

当前已经可以：

- 保留用户完整原话、分项需求、Agent 理解、原计划和实际执行轨迹；
- 从仍可访问的 Codex 任务、compact 线索、多 Agent 来源、Git 分支和项目文件中审计旧上下文；
- 在只读看板里查看项目脉络、动作结果复盘轨和个人决策手册；
- 给记录设置 `private`、`team`、`public`，生成独立的团队版或脱敏公开版；
- 导出 JSON / JSONL，或把多个项目里反复出现的 `dp-*` 原则汇成个人决策手册。

## 安装是干净的

- `skill/buildtrace/` 只有通用规则，没有任何人的 `BUILDTRACE.md`；
- 全局 Skill 只告诉 Agent 如何初始化、恢复与记录，不携带维护者或其他项目档案；
- 每个项目第一次激活时，才在该项目内创建自己的主源；
- 公开仓库只保留虚构演示。维护者自己的 BuildTrace 看板与其他真实项目看板留在各自本地项目中。

## 第一次安装

需要 Node.js 20 或更高版本。任何人拿到 GitHub 链接后，可执行一条命令：

```bash
npm install -g git+https://github.com/yimleunggggg/Buildtrace.git && buildtrace setup
```

这会安装通用 Skill，并为 Codex、Cursor、Claude Code、GitHub Copilot、Windsurf 与 Gemini CLI 配置记录规则。加载规则后，Agent 应在可写项目开始有意义工作时检查是否需要初始化。具体是否执行取决于工具和当前会话；首次使用请检查实际记录。

每个已初始化项目的 `AGENTS.md` 也带有记录规则。WorkBuddy 等会读取这个文件的工具可以使用同一套规则，不必在每个工具里重新解释；这不等于它们已经有完整的专用会话采集适配。

更新：

```bash
npm install -g git+https://github.com/yimleunggggg/Buildtrace.git && buildtrace setup
```

通过 GitHub 安装的用户用同一条命令升级；参与 BuildTrace 开发、直接在克隆仓库中运行 `node bin/buildtrace.mjs setup` 时，用户级 Skill 会链接到当前仓库，规则修改会立即反映到本机安装。

如果不想启用自动初始化，也可以只在目标项目手动说：

> 为这个项目启用 BuildTrace，并尽可能恢复此前上下文。先告诉我搜索了哪些任务、compact、fork、多 Agent、Git 和项目文件，哪些已经映射，哪些不可访问，再继续工作。

对应命令是 `buildtrace init --target /absolute/path/to/project`。初始化会生成历史来源清单，后续由 Agent 核对并补录。项目已有 `AGENTS.md` 时，先备份再加入 BuildTrace 区块，无需手动合并；同步只更新这个区块。已有项目升级运行 `buildtrace sync --target /absolute/path/to/project`，项目记录文件会保留。

## Agent 支持

| Agent | 常驻自动激活 | Skill | 项目规则 | 本地旧会话审计 |
| --- | --- | --- | --- | --- |
| Codex | `~/.codex/AGENTS.md` | `~/.agents/skills/buildtrace` | `AGENTS.md` | 支持 rollout、compact、fork / 多 Agent 清单 |
| Cursor | 全局 Skill + 项目 always-on rule | `~/.agents/skills` / `~/.cursor/skills` | `.cursor/rules/buildtrace.mdc` | 读取当前可访问会话或用户导出 |
| Claude Code | `~/.claude/CLAUDE.md` | `~/.claude/skills/buildtrace` | `CLAUDE.md` | 支持 `~/.claude/projects` 会话清单、compact 与 sidechain 线索 |
| GitHub Copilot | `~/.copilot/copilot-instructions.md` | `~/.agents/skills` / `~/.copilot/skills` | `.github/copilot-instructions.md` | 读取当前可访问会话或用户导出 |
| Windsurf | `global_rules.md` | Agent 可读取项目规则 | `.windsurf/rules/buildtrace.md` + `AGENTS.md` | 读取当前可访问会话或用户导出 |
| Gemini CLI | `~/.gemini/GEMINI.md` | 使用常驻规则 | `GEMINI.md` | 读取当前可访问会话或用户导出 |

“支持适配”不等于绕过各工具权限。已删除、无权限、从未保留或没有导出的原文，BuildTrace 会标成不可访问，而不是补编。

## 日常怎么用

初始化完成后，不用背固定口令，也不用每次先说 `$buildtrace`。照常告诉 Agent：

- “我觉得现在先让页面被收录，暂时别优化转化。”
- “把这个功能做掉，但记得两周后看搜索点击有没有变化。”
- “这个结果无效，原来的假设可能错了，补进记录。”
- “恢复一下这个项目之前为什么选这套结构，再继续。”

Agent 会在有意义的工作前读取项目目的、相关历史和到期回看；完成后，把本轮原话、理解、计划、实际执行和验证证据写回主源。只有信息缺失会改变判断时才应该追问。

已有档案按追加式记录约定维护。规则要求修改前保存内容哈希快照；修改后的校验会比较带稳定 ID 的记录与所选基线，检查记录删除，以及原话、需求总结、当时理解、计划和执行轨迹等受保护字段的变化：

```bash
buildtrace snapshot --target .
buildtrace verify-history --target .
buildtrace history --target .
```

快照保存在 Git 默认忽略的 `.buildtrace/history/`。若发生误改，可先查看历史，再用 `buildtrace restore --target . --snapshot <hash-prefix> --confirm` 回溯；恢复前的当前版本也会自动保存。真实纠错应追加时间、事实和新依据，不把旧说法静默改成“Agent 当时就知道”。

这不是文件写入硬锁：没有稳定 ID 的旧记录和尚未纳入比较的字段仍需人工审查，原文件与快照同机也需要另做独立备份。`buildtrace audit-quotes --target .` 只检查记录声明的来源与原文类型，不会与全部原始聊天逐字比对，不能据此证明没有漏话。

本地打开当前项目看板：

```bash
buildtrace serve --target .
```

Viewer 本身就是静态 HTML、CSS 和 JavaScript。通过上面的本地服务打开后，它会每 10 秒检查一次 Markdown；保存 `BUILDTRACE.md` 后无需重新构建，页面保持在前台时会自动读取最新内容。线上静态看板只有在新文件完成部署后才会更新，直接双击 `file://.../index.html` 也不是支持的打开方式。

更完整、按实际场景写的说明见[《BuildTrace 使用手册》](docs/USAGE.zh-CN.md)。

## 旧上下文能找回多少

第一次 `init` 会生成一份私有恢复清单，扫描当前用户仍安全可读的：

- Codex active / archived rollouts 与 compact 标记；
- 可辨认的多 Agent 和任务来源；
- Git 全部分支、提交、工作区和项目内聊天导出；
- README、运营日志、数据日报等项目证据。

需要重新审计时运行：

```bash
node bin/buildtrace.mjs recover --target /path/to/project
```

这不是“保证恢复所有聊天”的承诺。删除的、无权限的、从未导出的会话无法凭空找回；fork 的原生父子关系也不一定被工具完整暴露。报告必须区分已搜索、已匹配、已映射、未映射和不可访问，不能把推断写成确认事实。完整规则见 [`recovery-architecture.md`](docs/buildtrace/references/recovery-architecture.md)。

## 复盘、导出与跨项目使用

导出可移植数据：

```bash
node bin/buildtrace.mjs export --target /path/to/project --format json --output /path/to/buildtrace.json
node bin/buildtrace.mjs export --target /path/to/project --format jsonl --output /path/to/buildtrace.jsonl
```

从多个项目生成个人决策手册：

```bash
node bin/buildtrace.mjs playbook \
  --target /path/to/project-a \
  --target /path/to/project-b \
  --output /path/to/personal-decision-playbook.md
```

只有相同的稳定原则 ID 才会聚合；表述冲突会原样保留，不由程序替人揉成一个结论。

## 私密、团队与公开看板

本地看板直接读取完整主源，默认最私密。团队或公开分享要先生成新的派生目录：

```bash
node bin/buildtrace.mjs publish --profile team --target /path/to/project --output /empty/team-site
node bin/buildtrace.mjs publish --profile public --target /path/to/project --output /empty/public-site
```

旧记录默认是 `private`。团队版只包含 `team` / `public` 记录并清理内部路径；公开版只包含明确标记为 `public` 的记录，还会移除原话、Agent 内部过程、技术备注和项目资料。团队目录仍要部署在有访问控制的环境中。详见 [`DEPLOY.md`](docs/buildtrace/DEPLOY.md)。

## 三条边界

1. `BUILDTRACE.md` 是唯一可编辑主源；JSON、看板和个人手册都是可重建的派生物。
2. Viewer 只读，不用 `nodes.json` 或浏览器缓存保存项目事实。
3. 没有依据的内容不能写成事实，动作发生在数据变化之前也不等于它造成了变化。

## 借鉴与致谢

BuildTrace 不打算重做已经成熟的任务管理、知识库、产品分析或 DevOps 数据湖。设计新能力前，会先看这个需求是否已经被大量用户验证，再决定链接、接入、复用开放结构，还是只借鉴模式。

目前明确参考了 [Cline Memory Bank](https://cline.bot/blog/memory-bank-how-to-make-cline-an-ai-agent-that-never-forgets)、[Linear Projects / Updates](https://linear.app/docs/initiative-and-project-updates)、[PostHog annotations](https://posthog.com/docs/user-guides/annotations)、[Apache DevLake](https://devlake.apache.org/)、[ONES](https://docs.ones.com/zh-Hans/get-started/quick-start-guide-to-ones-project)、[TAPD](https://www.tapd.cn/home/solution/tapdlite) 与 [amber.ac](https://amber.ac/) 的已验证模式或视觉语言。完整边界和归因说明见 [`inspiration-and-attribution.md`](docs/buildtrace/references/inspiration-and-attribution.md)。

目前没有复制这些产品的代码或视觉资产。如果以后引入开源代码、schema 或资产，会记录来源和版本，并遵守原许可证；一句“感谢”不能替代许可证要求。

## 项目结构与开发

```text
docs/buildtrace/BUILDTRACE.md   项目记忆唯一主源
docs/buildtrace/SKILL.md        Agent 工作规则
docs/buildtrace/references/     恢复、结构与归因规范
docs/buildtrace/scripts/        确定性的历史审计与派生脚本
docs/buildtrace/viewer/         只读 Viewer
bin/buildtrace.mjs              init / sync / recover / export / playbook / publish / deploy-kit
tests/                          解析器与 CLI 测试
```

```bash
npm test
npm run doctor
npm run serve
```

当前仍是 alpha：CLI 通过 GitHub 安装，尚未发布到 npm registry；完整的跨工具历史读取仍受各工具保存范围、导出能力与权限限制。

## 开源许可

BuildTrace 采用 [MIT License](LICENSE) 开源。

Copyright © 2026 Yim leung。

该许可证只适用于 BuildTrace 仓库本身。使用 `init` 或 `sync` 将 BuildTrace 接入其他项目时，不会自动改变那些项目原有的许可证。
