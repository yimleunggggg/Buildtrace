# Changelog

## Unreleased

- Add optional matter identity, parent/related records, phase and distinct occurrence/backfill dates; retain unknown extension fields and sections.
- Introduce evidence-linked discussion, execution, delivery/checks and later feedback. Preserve legacy archives while avoiding mandatory duplicate paragraphs in new records.
- Add private handoff, Claude-memory text, LangChain Markdown and byte-preserving archive bundle exports with explicit source overrides and SHA-256 manifests.
- Add a local project overview with live metadata and selected project viewers; add read-only sync checks and project preferences that survive updates.
- Separate attachment envelopes from human messages, hide routine coordination from core reading and fix chronological ordering across project viewers.

- Separate work areas from action types with project-local Markdown classification rules, portable exports and two-color filters; retain full detail alongside optional concise highlights.
- Separate original messages, historical summaries and routine coordination; make public Agent statements/plans/actions auditable without implying access to private reasoning.
- Simplify record reading into changes, reasons and current outcomes with optional evidence/process details; replace the tutorial's command-first flow with concrete messages and expected results.
- Include project/record/source/worktree identity in correction and outcome handoffs, and extend recovery to sibling worktrees, historical aliases and transitive native Agent lineage.

- Make project initialization back up existing shared Agent instructions and insert an idempotent managed BuildTrace block, so tools that read `AGENTS.md` can use the project rules without a manual merge.
- Add read-only `buildtrace status` with actual archive location, latest record, count, hash and configured rule files; require Agents to verify saved work and report the record title, ID and location.
- Refuse symlink history indexes before appending snapshot metadata, avoiding writes through a replaced index file.
- Add a three-step new-user path in both READMEs and the board tutorial, with explicit limits on automatic capture and cross-device access.
- Rewrite board actions and guidance in plain language; move provenance codes into expandable details while retaining the complete source text and actual execution steps.
- Add content-addressed local history with `snapshot`, `history`, `verify-history`, and guarded `restore`; the local Viewer preserves before/after snapshots when its Markdown source changes.
- Add `audit-quotes` to expose missing or non-verbatim provenance without manufacturing old user messages, and make existing quotes and reasoning append-only in every Agent adapter.
- Simplify the Viewer by hiding visibility and outcome badges from record lists, fixing the latest-record date, shortening card previews, and rewriting synthetic demo copy in plain language.
- Add the standard MIT License for the BuildTrace repository, with copyright held by Yim leung; project initialization and synchronization do not alter downstream project licenses.
- Add a standalone Chinese product and implementation brief that lets a new Agent understand BuildTrace's purpose, causal record model, recovery boundary, architecture, CLI, privacy derivatives, current implementation, and operating contract without first reading the repository code.
- Clarify in the English README that real dogfooding archives remain in their own local projects and are not shipped in the repository or install package; remove stale project record counts from the public introduction.
- Refine the author story across the Chinese and English introductions around the durable problem BuildTrace solves, and link to the complete first-person essay instead of keeping time-sensitive project metrics in the README.

## 1.18.0-alpha.1 — 2026-07-27

- 新增 `buildtrace setup`：从 GitHub 全局安装后，一次配置 Codex、Cursor、Claude Code、GitHub Copilot、Windsurf 与 Gemini CLI 的干净 Skill 和常驻自动激活规则。
- 全局 Skill 移到独立 `skill/buildtrace/`，只含通用规则；公开仓库的 `docs/buildtrace/BUILDTRACE.md` 改为虚构演示，维护者与其他真实项目档案不再进入安装目录。
- `init` 新增 Claude、Copilot、Gemini 与 Windsurf 项目规则；恢复审计新增 Claude Code 本地 project session、compact、parent UUID 与 sidechain 清单。
- 决策手册只接收用户明确确认、来源 `confirmed` 且有依据的原则；Agent 自己概括的“方法论”不再自动进入个人手册。
- 修正 Viewer Markdown 下载响应和剪贴板降级；项目资料、部署与记录动作始终显示完整可手动复制的指令，并保证面板位于抽屉上层且可关闭。
- `sync` 会更新 BuildTrace 专属的 Cursor / Windsurf 规则；Claude / Copilot / Gemini 共用根规则只更新带起止标记的 BuildTrace 区块，不覆盖用户内容。
- 收敛 Viewer 长文阅读层级与 320px 手机布局；“作者的话”移入桌面/手机“关于”菜单，本地服务每 10 秒检查 Markdown 变化并自动刷新，静态线上版仍在部署后更新。

## 1.17.0-alpha.1 — 2026-07-19

- 新增结构化复盘轨：人的假设、实际动作、观察计划、数据变化与后来结果判断都保留在同一项目记录中。
- 新增稳定 `dp-*` 决策原则与跨项目 `playbook` 命令；只按稳定 ID 聚合，保留真实项目 / 记录证据，同 ID 异文明确显示为冲突。
- 每条记录新增 `private`、`team`、`public` 可见范围；旧记录安全默认私密。
- 新增 `publish --profile team|public`，在生成阶段裁剪记录并清除内部路径；公开版额外移除原话、Agent 内部过程、技术备注和项目资料。
- GitHub Pages 工作流改为生成脱敏公开产物，不再直接上传完整 `docs/buildtrace/` 主源。
- Viewer 增加「项目脉络 / 复盘轨 / 决策手册」三种视图、当前发布身份提示和记录级可见范围标签。
- 导出结构升级为 schema v3；模板、Skill、部署说明、解析器和测试同步更新。
- README 改为从真实项目经历和复盘痛点进入；新增第一人称对外介绍与面向非开发者的完整使用手册。
- 新增英文 README，为跨语言用户说明真实起点、恢复边界、隐私派生与项目级初始化方式。
- 用 BuildTrace 自身和 Yakushima Bus 两个真实项目完成 v1.17 试跑；Yakushima 补齐项目级自动规则、历史恢复审计、最新 UX 记录与首条结构化 SEO 观察契约。

## 1.16.0-alpha.1 — 2026-07-19

- 将首次安装升级为项目级历史恢复审计：扫描 Codex active / archived rollouts、compact 标记、多 Agent 来源、Git 全部分支与项目内可能的会话导出。
- 新增私有 `.buildtrace/recovery/latest.json` 恢复清单，记录来源哈希、匹配任务、消息引用、覆盖范围与不可访问缺口，不复制完整私密聊天，也不成为第二份事实源。
- 增加稳定 record ID、来源覆盖、关联任务、带来源与 fidelity 的完整原文、分项需求、`Agent 当时理解`、`Agent 计划` 与 `执行轨迹`。
- Viewer 默认显示数行原文并可展开全部；需求、理解、计划和实际执行按条目分开阅读。
- 新增 Markdown 派生 JSON / JSONL 导出，方便数据库、搜索、笔记与未来跨项目视图复用。
- 明确用户级 Skill 安装后在所有仓库可发现，但每个项目仍需 `init` 才拥有自己的主源、项目级自动规则和 Viewer。
- 将“不重复造轮子”写成长期产品规则：新能力先核对成熟产品、开放标准与开源项目的一手证据，再决定链接、接入、复用或自建。
- 新增国内外模式与透明归因清单，明确借鉴 Cline、Linear、PostHog、Apache DevLake、ONES 与 TAPD 的具体边界；当前未复制第三方代码或视觉资产。
- 明确跨会话上下文是基础契约，不是看板附属功能；并区分模式致谢、API 集成与代码复用三种不同的许可证责任。
- Viewer 改为暗色项目因果控制台：采用方角、细线、等宽元信息、注释式标签与克制的信号绿，同时保留中文长记录、资料柜、部署中心和完整执行详情的可读性；视觉参考 amber.ac，但未复制其代码或资产。

## 1.15.0-alpha.1 — 2026-07-18

- 建立唯一 Git 主仓和版本文件。
- 将 `BUILDTRACE.md` 固定为唯一主数据源。
- 新建只读 Markdown Viewer，移除 JSON、浏览器编辑和静默示例数据。
- 重做桌面、平板和手机信息架构。
- 增加 `init`、`serve`、`doctor` CLI。
- 恢复通用项目资料柜、显式资源分类、只读新增入口和带隐私检查的部署中心。
- 增加 `sync` 安全模板更新与 `deploy-kit` GitHub Pages 工作流生成；同步前自动备份旧模板，不改项目主源。
- 将“为什么做（人写的）”设为独立项目层，Viewer 可展开保留的完整原话。
- 增加 Markdown 解析和 CLI 回归测试。
- 明确自然语言自动摘取是默认路径，固定口令只用于补录、纠错和精确指定记录。
