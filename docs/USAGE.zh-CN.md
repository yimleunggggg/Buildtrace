# BuildTrace 使用手册

这份说明从“真实放进另一个项目后怎么用”开始。你不需要先理解 schema、JSON 或前端代码。

## 一、一键安装并为以后项目自动激活

Node.js 版本需要 20 或更高：

```bash
npm install -g github:yimleunggggg/Buildtrace && buildtrace setup
```

全局安装完成两件事：

- 把不含任何项目档案的干净 Skill 安装到 Agent 能发现的用户目录；
- 给 Codex、Cursor、Claude Code、GitHub Copilot、Windsurf 与 Gemini CLI 添加可重复更新的常驻指令。

以后在一个可写项目开始有意义的工作时，Agent 会先检查 `docs/buildtrace/BUILDTRACE.md`。没有时运行 `buildtrace init`，为当前项目创建自己的独立主源、规则、Viewer 和私密历史恢复清单。它不会提前批量修改硬盘上的所有仓库，也不会把一个项目的记录复制到另一个项目。

更新版本：

```bash
npm install -g github:yimleunggggg/Buildtrace && buildtrace setup
```

GitHub 安装使用同一条命令升级。若你在克隆的 BuildTrace 仓库里参与开发，运行 `node bin/buildtrace.mjs setup` 会把用户级 Skill 直接链接到这份工作区，修改规则后本机立即同步。

## 二、把它放进一个真实项目

如果自动激活没有发生，可在任意终端运行：

```bash
buildtrace init --target /absolute/path/to/your-project
```

也可以直接对 Agent 说：

> 为这个项目启用 BuildTrace，并尽可能恢复此前上下文。先列出已搜索、已匹配、已映射和不可访问的来源，再继续工作。

初始化会创建或补充：

```text
docs/buildtrace/BUILDTRACE.md
docs/buildtrace/SKILL.md
docs/buildtrace/viewer/
docs/buildtrace/references/
bin/buildtrace.mjs
AGENTS.md
.cursor/rules/buildtrace.mdc
CLAUDE.md
.github/copilot-instructions.md
GEMINI.md
.windsurf/rules/buildtrace.md
.buildtrace/recovery/latest.json
```

项目已经有 `AGENTS.md` 时，安装器不会直接覆盖，而会生成待合并文件并提示你处理。已有的 `BUILDTRACE.md` 也不会被改写。

初始化还会做第一次历史审计。报告位于 `.buildtrace/recovery/latest.json`，默认应保持私密并被 Git 忽略。它是“去哪里继续核对”的清单，不是项目事实主源。

## 三、第一次让 Agent 恢复项目

进入目标项目后，可以直接说：

> 先按 BuildTrace 恢复这个项目的目的、最近记录、相关历史和到期回看，再继续工作。

Agent 不应该只看最后一条记录。一次可靠恢复至少包括：

1. 项目为什么做、服务谁、当前最重要的判断和明确边界；
2. 最新记录、与本次需求有关的旧记录、已经到期的观察计划；
3. 恢复清单中匹配到的 Codex 任务、compact 线索、Git 分支和项目证据；
4. 哪些来源确实读过，哪些只匹配到，哪些不可访问；
5. 仍然会影响本次决策的矛盾、未决项和旧假设。

有 fork 或多 Agent 时，能确认的任务来源要分别保留；无法确认原生父子关系时，只能标成推断，不能补编一棵看似完整的任务树。

## 四、日常不用口令

完成项目初始化后，正常说话就可以：

> 我担心首页信息太多，先把公交搜索放回第一层，其他入口别删。

> 这次先做日文 SEO。我的假设是日语搜索曝光会上升，7 天后看 GSC，不要拿当天波动下结论。

> 这个功能做完以后没有改善，把结果补回原记录，判断改成“不成立”。

> 这句话是我的原话，不要改写。Agent 的推断放到“Agent 当时理解”里。

有意义的功能、修复、设计决定、架构变化、发布或运营动作完成后，Agent 应在同一轮写回 `BUILDTRACE.md`。纯聊天、临时探索和没有影响的格式调整不需要制造记录。

## 五、一条记录里分别放什么

BuildTrace 刻意把“人说的”和“Agent 理解的”分开：

| 部分 | 应该保存的内容 |
| --- | --- |
| 沟通原文 | 用户实际说过的话，逐段保留来源；长原话可以默认折叠，但不能只剩摘要 |
| 需求总结 | 按不同事项拆开，每条能指回原文，不新增原文里没有的要求 |
| Agent 当时理解 | Agent 当时如何解释任务、做了哪些判断；只记录当时实际表达过的内容 |
| Agent 计划 | 接到需求后如何拆步骤、排序和验证 |
| 执行轨迹 | 真正完成、改变、跳过或受阻的步骤，能对应原计划 |
| 人的假设 | 当时认为某个动作可能带来什么变化 |
| 观察计划 | 指标、数据源、基线、目标、观察窗口和判断规则 |
| 数据变化 | 后来看到的事实，注明时间、来源和与动作的先后关系 |
| 结果判断 | `supported`、`refuted`、`mixed` 或 `inconclusive`，并说明是谁下的结论 |
| 决策原则 | 只有用户确认要跨项目复用时，才使用稳定的 `dp-*` ID |

不能找到当时的 Agent 理解或计划时，应该写“未捕获”，而不是用现在的视角补一份更漂亮的过程。

## 六、把一次动作变成可回看的 milestone

假设你在 7 月 3 日修改了页面 description，希望清掉 Bing 的技术建议并提高搜索曝光。

当天先记录：

- 假设：description 更清楚后，相关页面的技术建议会消失，搜索曝光可能提高；
- 动作：修改了哪些页面，什么时候上线；
- 基线：上线前的警告数、曝光、点击；
- 观察窗口：7 月 3 日到 7 月 10 日；
- 达成规则：警告归零；曝光变化只能作为相关信号，不能自动归因。

到期后再补：

- 数据确实如何变化；
- 同期是否还有内容、索引或排名变化；
- 人最后判断这个假设成立、部分成立，还是证据不足。

时间轴上的“完成了修改”因此不会直接伪装成成果。它先是一项等待回看的动作，有后续事实后才可能成为 milestone。

## 七、打开只读看板

在目标项目运行：

```bash
buildtrace serve --target .
```

终端会显示本地地址。看板有三个主要视图：

- **项目脉络**只放明确标记的关键节点，适合按时间找主要版本、重要功能、架构转折、发布和确认里程碑；全部普通修复仍可在下方记录列表搜索；
- **复盘轨**适合找已到期的观察，沿着“假设—动作—数据—结论”回看；
- **决策手册**适合检查哪些判断已经在多个项目里重复出现。

看板已经是静态 HTML 页面，不需要前端构建。通过 `buildtrace serve` 打开时，它会每 10 秒检查一次 Markdown；页面在前台时，保存 `BUILDTRACE.md` 后会自动读取最新内容，切到后台则暂停检查。部署到线上后仍是静态站，只有新一轮部署完成才会出现更新。不要直接双击 `index.html` 用 `file://` 打开，因为浏览器通常会阻止它读取旁边的 Markdown。

Viewer 不能编辑主数据。详情底部的「纠正这条记录」会复制一句话，让 Agent 根据你的下一条说明修正事实和依据；「补记后来结果」用于一段时间后把数据、反馈和结论补回同一条记录。两者都不会直接修改看板，也不是日常必做步骤。不要去改浏览器缓存。

## 八、同步模板更新

当 BuildTrace 仓库更新后，在最新版仓库执行：

```bash
node bin/buildtrace.mjs sync --target /absolute/path/to/your-project
```

同步范围包括 Viewer、Skill、项目内 CLI、结构参考和部署说明。项目自己的 `BUILDTRACE.md` 与 `AGENTS.md` 会保留。被替换的旧模板进入 `.buildtrace/backups/`，方便核对差异。

同步完成后建议做三件事：

```bash
node /absolute/path/to/your-project/bin/buildtrace.mjs doctor --target /absolute/path/to/your-project
node /absolute/path/to/your-project/docs/buildtrace/viewer/serve.mjs
git diff -- docs/buildtrace bin/buildtrace.mjs
```

最后一条只用于检查，不要把 `.buildtrace/` 私有恢复报告或临时公开产物提交到仓库。

## 九、私密、团队与公开分享

每条记录可以标记：

- `private`：完整个人项目记忆；旧记录默认属于这一档；
- `team`：允许团队协作查看；
- `public`：明确允许进入公开派生看板。

生成团队版：

```bash
node bin/buildtrace.mjs publish --profile team --target /path/to/project --output /empty/team-site
```

生成公开版：

```bash
node bin/buildtrace.mjs publish --profile public --target /path/to/project --output /empty/public-site
```

公开版会在生成阶段去掉完整原话、Agent 理解与计划、执行轨迹、技术备注、项目资料和内部路径。发布前仍应人工浏览生成目录；脱敏工具不能替代对项目内容的判断。

## 十、把数据放到别处

JSON / JSONL 适合导入数据库、个人知识库或搜索系统：

```bash
node bin/buildtrace.mjs export --target /path/to/project --format json --output /path/to/buildtrace.json
node bin/buildtrace.mjs export --target /path/to/project --format jsonl --output /path/to/buildtrace.jsonl
```

跨项目个人决策手册：

```bash
node bin/buildtrace.mjs playbook \
  --target /path/to/project-a \
  --target /path/to/project-b \
  --output /path/to/personal-decision-playbook.md
```

导出文件和个人手册都是派生物。需要改事实时，仍然回到各项目自己的 `BUILDTRACE.md`。

## 十一、常见问题

### 为什么在另一个项目里搜不到 Skill？

先重新运行 `buildtrace setup`，检查 `~/.agents/skills/buildtrace/SKILL.md` 是否存在，并重启尚未刷新 Skill 列表的 Agent。Claude Code 还应有 `~/.claude/CLAUDE.md` 和 `~/.claude/skills/buildtrace`。仅复制 Viewer 不等于全局安装。

### 全局 Skill 会自动记录我所有项目吗？

会在“第一次进入某个可写项目并开始有意义的工作”时自动初始化；不会在安装当天批量扫描并修改所有目录。每个项目仍有一次独立 `init`，但这一步由常驻 Agent 规则自动触发。用户也可用上面的自然语言指令手动触发。

### 能不能找回被 compact 的内容？

如果本机仍保存 Codex rollout、Claude Code project session、任务读取接口仍可访问，或项目里有聊天导出，恢复审计会建立线索清单并要求 Agent 继续逐页核对。已经删除、无权限或从未保存的原文无法恢复。

### 为什么不直接接管 Git、Linear 或 PostHog？

这些工具已经擅长保存代码变化、任务状态和数据。BuildTrace 优先保存链接和证据引用，后续可以通过连接器自动拉取；不会为了一个看板再造一套任务系统或数据平台。

### 看板能直接改记录吗？

不能。只读是刻意的边界：避免 Markdown、浏览器状态和数据库同时变成三份互相冲突的真相。
