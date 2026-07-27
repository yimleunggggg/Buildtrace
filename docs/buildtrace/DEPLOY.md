# 部署自己的 BuildTrace 看板

BuildTrace Viewer 是静态、只读的项目看板。私密版读取项目主源；团队版和公开版只读取生成时已经裁剪、脱敏的新 Markdown，不会从网页写回项目记忆。

## 先选择公开范围

`BUILDTRACE.md` 可能包含人的原话、尚未验证的假设、本地路径、内部后台入口和证据位置。不要把完整主源直接交给静态托管，也不要依靠网页 CSS 或 JavaScript 隐藏内容：源文件仍能被下载。

- 私人查看：本地服务器直接读取完整主源，是默认方式。
- 团队查看：先生成团队快照，再放进带访问控制的私有仓库或托管平台。它包含 `team` 与 `public` 记录，但不包含 `private` 记录。
- 公开展示：只会包含明确标记 `可见范围: public` 的记录，并在生成阶段移除原话、Agent 内部过程、技术备注、项目资料和内部路径。

旧记录没有 `可见范围` 时一律按 `private` 处理，不会因为升级突然公开。

## 本地查看

在项目根目录运行：

```bash
node docs/buildtrace/viewer/serve.mjs
```

然后打开终端显示的本地地址。

## 生成团队快照

输出目录必须为空或尚不存在：

```bash
node bin/buildtrace.mjs publish --profile team --target . --output .buildtrace/team-site
```

团队快照仍可能包含团队可见的完整原话和业务判断。生成成功不等于已经鉴权；部署时必须另外配置登录、私有网络或平台访问控制。

## 生成脱敏公开版

```bash
node bin/buildtrace.mjs publish --profile public --target . --output .buildtrace/public-site
```

命令会先生成再检查。只要产物里仍出现绝对路径、本地链接或常见密钥格式，就会失败，不会带警告继续发布。每次重新生成请使用新的空目录；不要手工维护派生 Markdown。

## GitHub Pages

先生成不会覆盖既有文件的部署工作流：

```bash
node bin/buildtrace.mjs deploy-kit --provider github-pages --target .
```

提交 `.github/workflows/buildtrace-pages.yml`，再在仓库设置中启用 GitHub Pages 的 GitHub Actions 来源。工作流运行 `publish --profile public`，不会把私密 `BUILDTRACE.md` 直接上传。

GitHub Free 的 Pages 面向公开仓库；从私有仓库发布 Pages 需要支持该能力的付费方案。

## Cloudflare Pages

先生成公开产物，再上传该目录：

```bash
npx wrangler pages deploy .buildtrace/public-site
```

首次运行会要求选择或创建 Pages 项目。Direct Upload 项目后续不能直接切换成 Git integration；如果未来希望跟随 Git 自动发布，建议一开始就在 Cloudflare 控制台选择 Git integration。

## Vercel

先生成公开产物，再把它作为部署目标：

```bash
npx vercel .buildtrace/public-site --prod
```

如果项目本来就在 Vercel，也应把每次构建生成的公开目录作为输出，不要把 `docs/buildtrace` 私密主源配置成公开 Root Directory。

## 更新已安装项目

项目里的 Viewer 是可部署副本，不使用指向开发仓库的软链接。BuildTrace 模板更新后，从最新版 BuildTrace 仓库运行：

```bash
node bin/buildtrace.mjs sync --target /path/to/project
```

同步只更新 BuildTrace 管理的 Viewer、Skill、部署说明和 CLI，不改目标项目的 `BUILDTRACE.md` 或 `AGENTS.md`。被替换的旧文件会先备份到目标项目的 `.buildtrace/backups/`。
