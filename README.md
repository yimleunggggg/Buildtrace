# BuildTrace

[简体中文](README.md) · [English](README.en.md)

BuildTrace 给用 AI 做项目的人保存一条项目脉络：当时为什么这样做，Agent 怎么理解、怎么推进，后来数据有没有变化，这个判断最后成不成立。

当前版本：`v1.17.0-alpha.1`

## 我为什么做它

最近几个月，我围绕自己的爱好密集地玩 vibe coding：做过户外圈子的社交软件，也因为在日本徒步时找不到交通信息，做了一个屋久岛公交查询工具。后者上线一个半月有了 800 多位用户，约 60% 来自自然搜索。还有一个户外行李和装备管理工具。很多时候，我就是自己产品的用户。

代码越做越快，我却开始遇到一个很具体的问题：看数据复盘时，想不起那个阶段到底做过什么。思考在一个 Agent 里，开发在另一个工具里，部署和数据又散在别处。为了弄清“是哪件事让数据变了”，翻遍所有地方，也拼不出完整的因果链。

更可惜的是，聊天里那些带着人的主观性的判断很快会消失：

> 我觉得 Bing 来的用户大概率是日语意图。
>
> 这个阶段先不管转化，先让页面被索引到。

这些话不会自然出现在 Git commit 里，遇到上下文压缩后也未必还在。可它们才说明项目为什么走到这里，也逐渐构成一个人的审美、运营逻辑和做事方式。

BuildTrace 就从这个问题开始。更完整的自述见[《我为什么做 BuildTrace》](docs/INTRODUCTION.zh-CN.md)。如果要把整个产品一次性交给新的 Agent 或协作者，直接发送[《BuildTrace：产品与实现全景说明》](docs/PRODUCT-AND-IMPLEMENTATION.zh-CN.md)，不需要对方先阅读代码。

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

主数据是一份项目内的 Markdown 文件：[`docs/buildtrace/BUILDTRACE.md`](docs/buildtrace/BUILDTRACE.md)。Agent 负责从自然对话和实际工作中记录，Viewer 只负责阅读、搜索和复盘。Git、数据平台、项目管理工具仍做它们擅长的事；BuildTrace 保存它们通常不会替你保存的“为什么”和“后来呢”。

当前已经可以：

- 保留用户完整原话、分项需求、Agent 理解、原计划和实际执行轨迹；
- 从仍可访问的 Codex 任务、compact 线索、多 Agent 来源、Git 分支和项目文件中审计旧上下文；
- 在只读看板里查看项目脉络、动作结果复盘轨和个人决策手册；
- 给记录设置 `private`、`team`、`public`，生成独立的团队版或脱敏公开版；
- 导出 JSON / JSONL，或把多个项目里反复出现的 `dp-*` 原则汇成个人决策手册。

## 两个真实项目

这不是一份只给演示数据用的模板。

- **BuildTrace 自己**：项目为什么转向 Markdown、看板为什么重做、历史恢复与分享边界怎么决定，都由 BuildTrace 自己持续记录。
- **YakuBus / Yakushima Bus**：目前有 37 条项目记录，从官方 PDF 数据管线、公交搜索、地图与多语言，到 SEO、GA4、Bing 和后来要回看的运营动作。

在本仓库运行 `npm run serve` 可以查看 BuildTrace 自身看板。另一个项目同步模板后，在它的目录运行 `node docs/buildtrace/viewer/serve.mjs`，看到的是那个项目自己的资料和记录，不会混进 BuildTrace 的内容。

## 第一次安装

需要 Node.js 20 或更高版本。

```bash
git clone https://github.com/yimleunggggg/Buildtrace.git
cd Buildtrace
npm install
npm test
node bin/buildtrace.mjs install-codex-skill
```

最后一条命令会把本仓库的整个 Skill 文件夹软链接到 `~/.agents/skills/buildtrace`。以后在这个仓库更新 Skill，本机安装版本会一起变化，不需要反复复制。

用户级 Skill 安装一次后，Codex 可以在任何仓库发现它；但 BuildTrace **不会默认修改所有项目**。每个项目仍要初始化一次，才能得到自己的主源、项目规则和 Viewer：

```bash
node /path/to/Buildtrace/bin/buildtrace.mjs init --target /path/to/your-project
```

已有项目要跟随模板更新时，在最新版 BuildTrace 仓库运行：

```bash
node bin/buildtrace.mjs sync --target /path/to/your-project
```

`sync` 会更新 BuildTrace 管理的 Skill、Viewer、项目内 CLI 和部署说明，替换前先备份旧模板；它不会改写该项目自己的 `BUILDTRACE.md` 或 `AGENTS.md`。

## 日常怎么用

初始化完成后，不用背固定口令，也不用每次先说 `$buildtrace`。照常告诉 Agent：

- “我觉得现在先让页面被收录，暂时别优化转化。”
- “把这个功能做掉，但记得两周后看搜索点击有没有变化。”
- “这个结果无效，原来的假设可能错了，补进记录。”
- “恢复一下这个项目之前为什么选这套结构，再继续。”

Agent 会在有意义的工作前读取项目目的、相关历史和到期回看；完成后，把本轮原话、理解、计划、实际执行和验证证据写回主源。只有信息缺失会改变判断时才应该追问。

本地打开看板：

```bash
node docs/buildtrace/viewer/serve.mjs
```

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

当前仍是 alpha：仓库 CLI 尚未发布到 npm；完整的跨工具历史读取也受各工具导出与权限范围限制。

## 开源许可

BuildTrace 采用 [MIT License](LICENSE) 开源。

Copyright © 2026 Yim leung。

该许可证只适用于 BuildTrace 仓库本身。使用 `init` 或 `sync` 将 BuildTrace 接入其他项目时，不会自动改变那些项目原有的许可证。
