---
name: buildtrace
description: Maintain lightweight, evidence-backed project memory in the current project's docs/buildtrace/BUILDTRACE.md after meaningful work, before context restore, during historical backfill, or when the user corrects intent and outcomes.
---

# BuildTrace v1.17

BuildTrace 保存项目因果，而不是复制 Git 记录。唯一主源是当前项目根目录下的 `docs/buildtrace/BUILDTRACE.md`。

## 默认从自然语言自动摘取

- 固定口令不是激活条件。用户照常描述需求、出发点、担心、取舍、反馈和结果，Agent 从当前可访问的自然语言对话中识别值得保留的原话与判断。
- 有意义的工作开始前，自动读取与当前任务有关的项目初心、最近记录、相关记录和到期回看；不要要求用户先说“恢复上下文”。
- 有意义的功能、修复、设计、架构、发布、Agent 工作流或重要决策完成后，在同一轮自动记录对话、实际改动、证据和后续观察；不要要求用户再说“记录本轮”。
- 自然语言中的设想不等于已经完成的改动。只把实际发生且有依据的内容写进“做了什么”，未实施的方向留在动机、决策或后续观察中。
- 只有缺失信息会改变事实判断时才追问；其余缺口如实标记 `unknown`，不中断正常工作。

## 新能力先核对成熟模式

- 设计重要产品能力前，先用官方文档、原始项目或开源仓库核对：这个用户痛点是否已经被成熟产品反复证明，以及现有能力能否通过链接、导出、API、开放结构或合规依赖直接复用。
- 不从竞品界面照抄，也不为了“原创”重建任务管理、知识库、分析平台或数据采集器。只在 BuildTrace 独有的人的原话与判断、Agent 执行、外部证据和后来结果链路上做原创实现。
- 在相关项目记录中写明参考模式、采用了什么、没有采用什么和自建理由。官方来源进入 `依据`；推断的市场需求不能写成已验证事实。
- 只借鉴产品模式时，在 README 或 `references/inspiration-and-attribution.md` 透明致谢即可，并明确没有复制代码。实际引入第三方代码、资产或 schema 时，必须先核对许可证，保留版权与许可证声明，并按需要维护 `THIRD_PARTY_NOTICES.md`；“感谢”不能代替合规。
- 当前参考模式与边界见 `references/inspiration-and-attribution.md`。首次安装、恢复和后续记录仍以当前项目事实为准，不能把参考产品的做法自动写成用户需求。

## 定位当前项目

- Skill 的安装目录只保存工作规则，不保存当前项目事实。
- 始终从当前工作区所属的项目根目录读取和修改 `docs/buildtrace/BUILDTRACE.md`。
- 不要因为全局 Skill 目录旁边存在其他 `BUILDTRACE.md`，就把它当成当前项目的记录。
- 多项目工作区按本轮实际修改的项目分别维护，不把不同项目写进同一份记录。
- 当前项目尚未初始化 BuildTrace 时，先明确说明；只有在用户要求安装或初始化时才创建项目文件。

## 开始工作前

开始有意义的工作，或用户说“继续”“恢复上下文”“上次做到哪”时：

1. 读取“项目初心”。
2. 读取最近 3–5 条记录。
3. 读取所有 `结果状态: 待观察` 且已经到期的记录。
4. 只总结与当前任务有关的上下文。

如果项目刚初始化、用户要求恢复全部历史，或 `.buildtrace/recovery/latest.json` 尚未完成映射，必须继续执行“首次安装与历史恢复”，不能把最近 3–5 条记录误当成完整历史。

## 首次安装与历史恢复

首次安装到一个已有项目时，在继续产品工作前完成以下链路：

1. 运行 `node bin/buildtrace.mjs recover --target <project>`，读取私有恢复清单。
2. 如果当前环境提供 `list_threads` / `read_thread`，按项目路径、Git origin 和用户给出的线索查找所有匹配任务，并使用分页游标一直读取到没有更早页面。
3. 对每个任务记录完整用户消息、Agent 消息、compact 事件、计划、工具调用、文件改动和结果。compact 标记不是原文替代品；任务或本地 rollout 仍有原文时必须使用原文。
4. 读取 active / archived rollout、Git 全部分支和相关 worktree、项目文档、截图、聊天导出与数据证据。
5. 沿原生 parent/child 关系恢复多 Agent 树；每个子 Agent 保留任务、计划、执行、证据、handoff 和结果。fork 无原生父 ID 时，只能用稳定消息 ID 或共享前缀推断，并标记 `inferred`。
6. 写明搜索范围、匹配任务、已映射内容、未映射内容和不可访问来源，再把相关证据提升为项目记录。

详细来源顺序、可信等级与完成标准见 `references/recovery-architecture.md`。不得绕过权限，不得把删除、不可访问或从未导出的会话说成已恢复。

## 记录本轮

在功能、修复、设计、增长、数据、变现、架构、发布、Agent 工作流或重要决策完成后，写一条记录。

不要为拼写修正、纯格式化和一次性探索建节点。

每条记录必须包含：

```md
### YYYY-MM-DD — 人能直接看懂的标题

记录 ID: bt-YYYYMMDD-stable-name
来源可信度: confirmed | inferred | unknown
来源覆盖: current-turn, codex-task, local-rollout, git, project-files, cross-tool-export, external-platform
关联任务: codex-thread/<thread-id> / 未记录
依据: 本轮对话 / 文件 / commit / 截图 / 数据导出
场景: feature | bugfix | ux-content | seo-growth | analytics-data | monetization | architecture | ops-release | ai-workflow | decision
可见范围: private | team | public
结果状态: 待观察 | 有效 | 无效 | 不确定
后续回看: YYYY-MM-DD / 无

沟通原文:
- [Q1 | user | source-reference | verbatim]
  > 与本记录有关的完整用户消息，不删节、不改写；没有原文时明确写 compacted-summary、artifact-evidence 或 unavailable。

需求总结:
- [R1 <- Q1] 按事情拆开的第一项需求。
- [R2 <- Q1] 按事情拆开的第二项需求。

Agent 当时理解:
- [U1 <- R1,R2] Agent 当时实际形成的理解；不要用完成后的认识回写成“当时就知道”。

Agent 计划:
- [P1 <- R1] 当时的第一步计划。

执行轨迹:
- [E1 <- P1 | completed] 实际执行步骤、变化和对应证据。

人的假设:
- [H1] 这次需要在后来用事实验证、推翻或修正的人的判断；没有就省略。

为什么做:
- 人的动机、顾虑、假设或取舍。

做了什么:
- 用户或项目实际发生的变化。

观察计划:
- [W1 | 指标=要观察什么 | 数据源=从哪里看 | 基线=当前值 | 目标=希望看到什么 | 窗口=观察多久 | 达成规则=怎样才算成立] 观察动作后来是否有效；没有就省略。

数据变化:
- [D1 | 日期=YYYY-MM-DD | 指标=指标名 | 值=观察值 | 变化=相对变化 | 来源=证据位置] 有证据后再补，不要预填。

结果判断:
- [O1 | supported | 日期=YYYY-MM-DD] supported / refuted / mixed / inconclusive / pending；只按后来证据判断。

决策原则:
- [dp-stable-principle-id | 分类] 这次真实体现、值得跨项目复用的判断；没有就省略。

技术备注:
- 文件、命令、commit、验证、截图或数据来源。

结果:
- 待回看，或后续结论与证据。
```

## 证据规则

- 事实必须有 `依据`。
- Git 日期只能证明 commit 存在，不能自动证明功能上线。
- 不得编造用户原话、截图、数据、部署、commit 或结果。
- 找不到原始动机时写 `unknown`，不要根据代码讲一个完整故事。
- `沟通原文` 是可核对的来源层，不是润色稿；`需求总结` 才是 Agent 的提炼。
- `沟通原文` 默认保存与记录有关的完整用户消息；不得把多个时点的话拼成一句更顺的“原话”。
- 一条记录包含多件事时，`需求总结` 必须拆成可追踪条目，并链接对应 quote ID。
- `Agent 当时理解`、`Agent 计划` 与 `执行轨迹` 分开保存。计划变化不能在事后被抹平。
- 每条新记录使用稳定 `记录 ID`；修改标题不修改 ID。结构规范见 `references/record-schema-v3.md`。
- `人的假设 → 做了什么 → 数据变化 → 结果判断` 是可逐步补齐的复盘轨。不存在的内容省略，不为结构完整而发明。
- 决策原则只在真实记录明确体现时添加，并使用稳定 `dp-*` ID。跨项目相同原则沿用同一 ID；同 ID 不同表述保留为冲突，不能自动揉成一条。

## 私密、团队与公开派生物

- 旧记录和新记录默认 `可见范围: private`。只有用户明确表达共享意图时，才可标为 `team` 或 `public`；Agent 不得自行判断并公开。
- 私密 Viewer 直接读取完整主源，适合个人日常使用。
- 团队或公开分享必须运行 `buildtrace publish --profile team|public --output <empty-directory>` 生成新目录。不得把浏览器隐藏当成脱敏，因为源文件仍可被直接下载。
- 团队快照排除私密记录和项目入口，并清理任务来源、绝对路径与本地链接；必须由用户放在有访问控制的环境中。
- 公开快照只包含明确标记 `public` 的记录，并额外移除沟通原文、Agent 内部过程和技术备注。
- 发布命令发现残留的本地路径、localhost 或常见密钥格式时必须失败，不能带警告继续发布。
- `buildtrace playbook --target <project-a> --target <project-b>` 可从多个项目派生个人决策手册；它是索引，不是新的事实主源。

## 多 Agent 记录

- 根 Agent 负责把子 Agent 结果合并进当前项目记录，但不得把所有子 Agent 的过程压成一句“并行完成”。
- 子 Agent 的任务路径、父子 thread ID、原计划、实际工具与文件证据、handoff 和最终状态应进入 `执行轨迹` 或 `技术备注`。
- 多个 Agent 对同一事实有冲突时并列保留来源，不擅自融合成一个确定结论。
- 未完成、被中断或在 fork 时尚未复制的活动轮次必须标记缺口。

## 可迁移数据

- Markdown 是唯一可编辑主源；`.buildtrace/recovery/latest.json` 是私有恢复清单，不是事实库。
- 使用 `buildtrace export --format json` 或 `--format jsonl` 生成数据库、搜索、笔记或跨项目视图所需的派生数据。
- 派生文件不得被 Viewer 或 Agent 当成第二份可编辑事实源。

## 可选的显式控制

以下短语用于补录、纠错或精确指定目标，不是自动摘取的必要触发器。用户用普通自然语言表达同样的意图时，也应完成对应操作。

- `记录本轮`：自动记录遗漏时，根据对话和文件变化立即补录。
- `补原文`：补充或替换沟通原文。
- `修正「标题」`：修正事实并同步调整可信度和依据。
- `这条不用复盘`：设为 `结果状态: 不确定`、`后续回看: 无`。
- `标记待观察`：写观察日期或条件。
- `结果有效 / 无效 / 不确定`：更新结果和依据。
- `添加项目入口`：维护“项目入口 / 参考资料”。

English aliases are equally valid: `Restore context`, `Record this session`, `Correct "title"`, and `Outcome effective / ineffective / uncertain`.

## 旧项目回填

默认扫描全部安全可读历史，但必须先写证据盘点：

- 搜索了什么文件、Git 范围、聊天导出、截图和外部数据。
- 哪些来源不可访问。
- 覆盖等级：`current-turn`、`local-project`、`transcript-audited`、`cross-tool-exported`、`external-platform-audited`。
- 哪些内容仍未映射或可能遗漏。

证据可读且没有隐私或规模阻塞时，同一轮完成第一版主题级回填。不要声称恢复了不可访问或已被压缩且无残留的对话。

## Viewer 边界

- Viewer 只读取 `BUILDTRACE.md`。
- Viewer 不创建 `nodes.json`，不保存浏览器事实，不提供直接编辑表单。
- 用户在 Viewer 中看到的“复制修正指令”只是复制给 Agent 的明确命令。
- 加载失败时必须显示文件位置和修复方法，不能静默展示示例数据。
