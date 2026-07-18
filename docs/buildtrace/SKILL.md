---
name: buildtrace
description: Maintain lightweight, evidence-backed project memory in BUILDTRACE.md after meaningful work, before context restore, during historical backfill, or when the user corrects intent and outcomes.
---

# BuildTrace v1.15

BuildTrace 保存项目因果，而不是复制 Git 记录。唯一主源是同目录的 `BUILDTRACE.md`。

## 开始工作前

当用户说“继续”“恢复上下文”“上次做到哪”或开始重要工作：

1. 读取“项目初心”。
2. 读取最近 3–5 条记录。
3. 读取所有 `结果状态: 待观察` 且已经到期的记录。
4. 只总结与当前任务有关的上下文。

## 记录本轮

在功能、修复、设计、增长、数据、变现、架构、发布、Agent 工作流或重要决策完成后，写一条记录。

不要为拼写修正、纯格式化和一次性探索建节点。

每条记录必须包含：

```md
### YYYY-MM-DD — 人能直接看懂的标题

来源可信度: confirmed | inferred | unknown
依据: 本轮对话 / 文件 / commit / 截图 / 数据导出
场景: feature | bugfix | ux-content | seo-growth | analytics-data | monetization | architecture | ops-release | ai-workflow | decision
结果状态: 待观察 | 有效 | 无效 | 不确定
后续回看: YYYY-MM-DD / 无

沟通原文:
- 原话；没有则写“未捕捉”或“来自旧记录摘要，非原始对话”。

需求总结:
- Agent 用项目语言写的一句话总结。

为什么做:
- 人的动机、顾虑、假设或取舍。

做了什么:
- 用户或项目实际发生的变化。

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
- `沟通原文` 是摘录，不是润色稿；`需求总结` 才是 Agent 的提炼。

## 低摩擦命令

- `记录本轮`：根据对话和文件变化起草记录。
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
