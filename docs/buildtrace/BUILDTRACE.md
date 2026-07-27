# BuildTrace Demo

## 项目初心

- 为什么做这个项目: 演示 BuildTrace 如何把人的假设、Agent 执行、真实证据和后来结果放在同一份可移植 Markdown 中。
- 服务谁: 第一次打开公开仓库、尚未初始化自己项目的人。
- 当前最重要的判断: 公开仓库只提供通用规则和虚构示例，不包含维护者或任何真实项目的档案。
- 明确边界: 这是一份演示数据；真实项目必须运行 `buildtrace init` 创建自己的独立主源。

## 项目入口 / 参考资料

- [code] GitHub repository: https://github.com/yimleunggggg/Buildtrace — 安装、源码与问题反馈
- [docs] 使用手册: ../USAGE.zh-CN.md — 一键安装、旧项目恢复与日常使用
- [deploy] 部署说明: ./DEPLOY.md — 私密、团队与公开看板

## 项目记录

### 2026-01-10 — 用一个独立 Markdown 保存项目因果

记录 ID: bt-20260110-demo-markdown-source
来源可信度: confirmed
来源覆盖: synthetic-demo, project-files
关联任务: demo
依据: docs/buildtrace/BUILDTRACE.md；docs/buildtrace/viewer/parser.mjs
场景: architecture
关键节点: 是
可见范围: public
结果状态: 有效
后续回看: 无

沟通原文:
- [Q1 | demo | synthetic-demo | artifact-evidence]
  > 这是虚构的公开演示，不是任何真实用户的聊天原文。

需求总结:
- [R1 <- Q1] 展示项目记忆只有一份可编辑 Markdown 主源。
- [R2 <- Q1] 展示 Viewer 和导出都只是可重建的派生物。

Agent 当时理解:
- [U1 <- R1,R2] 演示需要说明数据边界，不能让示例看起来像维护者的真实项目档案。

Agent 计划:
- [P1 <- R1] 创建结构完整但不含个人信息的示例记录。
- [P2 <- R2] 让 Viewer、doctor 和导出都从同一文件读取。

执行轨迹:
- [E1 <- P1 | completed] 创建虚构演示主源。
- [E2 <- P2 | completed] 解析、校验和只读展示共享同一 Markdown。

人的假设:
- [H1] 规则与项目事实分离后，任何人安装全局 Skill 都不会继承维护者档案。

为什么做:
- Skill 可以全局复用，但项目事实必须留在各自项目里。

做了什么:
- 公开仓库提供纯净演示；初始化命令为目标项目创建新的独立 `BUILDTRACE.md`。

数据变化:
- [D1 | 日期=2026-01-10 | 指标=可编辑事实源数量 | 值=1 | 变化=固定为 Markdown 单一主源 | 来源=项目文件]

结果判断:
- [O1 | supported | 日期=2026-01-10] Viewer、JSON 和公开快照都能从 Markdown 重新生成。

技术备注:
- 本记录为 synthetic-demo，不代表真实发布、用户数据或产品效果。

结果:
- 架构演示完成。

### 2026-01-17 — 记录一个需要后来验证的动作

记录 ID: bt-20260117-demo-review-track
来源可信度: confirmed
来源覆盖: synthetic-demo
关联任务: demo
依据: templates/BUILDTRACE.md；docs/buildtrace/references/record-schema-v3.md
场景: decision
关键节点: 是
可见范围: public
结果状态: 待观察
后续回看: 2026-02-17

沟通原文:
- [Q1 | demo | synthetic-demo | artifact-evidence]
  > 这是虚构的复盘示例，用来说明动作完成不等于结果已经成立。

需求总结:
- [R1 <- Q1] 把假设、动作、观察窗口和判断规则分开记录。
- [R2 <- Q1] 没有后来数据时保持待观察，不提前宣布成功。

Agent 当时理解:
- [U1 <- R1,R2] 关键节点可以代表重要动作，但只有后来证据才能支持效果结论。

Agent 计划:
- [P1 <- R1] 写清假设和实际动作。
- [P2 <- R2] 预先约定数据源、窗口和达成规则。

执行轨迹:
- [E1 <- P1 | completed] 创建演示复盘轨。
- [E2 <- P2 | completed] 保留结果为空，等待虚构观察窗口结束。

人的假设:
- [H1] 如果新手能从安装说明直接完成一个项目初始化，首次使用门槛就会下降。

为什么做:
- 只记录“上线了什么”无法判断动作是否有效。

做了什么:
- 将安装说明放到公开 README，并提供一条全局安装命令与一条手动初始化口令。

观察计划:
- [W1 | 指标=首次初始化完成率 | 数据源=明确授权的匿名反馈 | 基线=unknown | 目标=目标用户能够独立完成 | 窗口=发布后 30 天 | 达成规则=有实际用户完成且能说明项目档案与全局 Skill 的区别]

数据变化:

结果判断:
- [O1 | pending] 目前没有真实用户数据；不得从演示记录推断产品效果。

决策原则:
- [dp-separate-rules-from-records | 分类=架构] 全局安装只携带规则，项目事实始终留在项目自己的主源中；这是一条未获用户确认的演示候选，不进入个人决策手册。

技术备注:
- 这是 synthetic-demo；观察计划不会被当成真实产品指标。

结果:
- 等待真实、授权且可核对的使用反馈。
