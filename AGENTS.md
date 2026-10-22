# dsh-skill-collections 开发与同步规则

- 本插件是独立 Git 仓库：`git@github.com:caicongmin/dsh-skill-collections.git`，使用 `main` 分支；保留远程历史，不强制推送。
- 插件源码、已有 `lib/` 构建产物、manifest、patch 和文档在本仓库同步，不再复制到统一迁移仓库的 `bundle/plugins/`。
- 后续每批实际插件修改必须同步递增 `package.json.version`（兼容修复默认 patch，新功能 minor，不兼容变更 major），并在变更记录中说明。仅备份、拉取、推送已有内容时不重复升版。
- 功能修改时按影响范围构建并同步对应产物；单纯备份不重建、不测试。旧版本 `.tgz` 不冒充新版本，不自动发布 Release 或 tag。
- 用户要求同步/备份时，有实际变化则在本仓库提交、推送；已有未推送提交也要推送，无变化不创建空提交。
- 迁移在目标机 clone；已有 checkout 使用 `git pull --ff-only`，再通过 DSH 的 `file:` 本地包安装流程刷新。保留用户未提交修改，不 reset/clean。
- Skill 库和收藏夹是用户数据，仍由统一迁移仓库的 `bundle/skills/` 备份，不加入本插件仓库；不提交凭据、会话、缓存或 `node_modules/`。
