# 在 Windows 发布 npm 预构建包

公开包名：`dsh-skill-collections`。Git 源码包仍叫 `@dsh-external/dsh-skill-collections`，保留现有开发安装；两个包使用相同 loader entry、路由和数据目录，不能同时安装。

## 1. 开发机准备

每批功能改动同步递增根 `package.json.version` 并更新 `CHANGELOG.md`，然后在插件目录执行：

```bash
npm run build
npm run build:client
npm test
npm run pack:npm
```

输出在 `release/`：当前版本为 `dsh-skill-collections-0.1.0.tgz` 及同名 `.sha256` 文件。脚本从同一份 manifest 生成公开包，切换 patch 和浏览器模块 ID，移除开发脚本/依赖；不会修改当前源码安装的 `lib/client.js`、Profile 或用户数据。发布包自带构建产物，消费者无需源码、编译器或构建授权。

**无需在 Linux 登录 npm，不传递 npm 凭据。** 将验证过的 `.tgz` 和 `.sha256` 下载到 Windows，不必解压，也不必安装源码依赖。`npm pack` 和本地验证都不代表已经公开发布。

## 2. Windows PowerShell 发布

安装 Node.js/npm 后，在下载目录执行（若 `npm` 被 PowerShell 脚本策略阻止，使用 `npm.cmd`）：

```powershell
npm.cmd login --registry=https://registry.npmjs.org/
npm.cmd whoami --registry=https://registry.npmjs.org/

# 核对本机哈希与下载的 .sha256 内容一致。
Get-FileHash .\dsh-skill-collections-0.1.0.tgz -Algorithm SHA256
Get-Content .\dsh-skill-collections-0.1.0.tgz.sha256

# 发布已经打好的包，不要在源码根目录直接 npm publish。
npm.cmd publish .\dsh-skill-collections-0.1.0.tgz --access public --registry=https://registry.npmjs.org/
npm.cmd view dsh-skill-collections@0.1.0 version --registry=https://registry.npmjs.org/
```

登录/发布时的浏览器授权、双重验证或安全设置仅在 npm 官方页面/本机终端完成，不发到聊天里。发布需要命令行登录，只有网页登录还不够。若 npm 拒绝包名或权限，不要改包内文件或反复发布；先把不含凭据的错误信息提供给维护者，再统一调整公开包名与客户端 ID、重新打包验证。同一版本不能重复发布。

## 3. 安装与更新

**仅在发布成功后**，用户可直接执行：

```bash
dsh plugin --profile web add dsh-skill-collections
```

固定版本安装：

```bash
dsh plugin --profile web add dsh-skill-collections@0.1.0
```

尚未发布时也能使用下载的预构建包（PowerShell，路径改为本机实际文件）：

```powershell
dsh plugin --profile web add "C:\Users\你的用户名\Downloads\dsh-skill-collections-0.1.0.tgz"
```

更新后重启 DSH。已安装旧 scoped 源码包的机器不能直接再加公开包；应先备份 Profile，停止 DSH，确认并移除旧包/热注入通道，再安装公开包。若 Profile 的自定义 patch 显式写了旧包名，只替换对应 entry 的 name 为 `dsh-skill-collections`，保留原配置和启停状态，且同一个 entry id 只保留一条。不要删除 Skill 库、收藏夹或工作区配置；发布方式变化不需要迁移这些数据。本次打包不会自动切换当前机器的安装。
