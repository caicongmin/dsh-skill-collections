# Security and review boundaries / 安全与审核边界

## Capabilities and permissions

This is a **local file-management plugin**, not a read-only viewer. Only install
it in a DSH instance you trust. The browser API requires official Connection
Host/Origin authentication and an **owner** principal before reading a request
body or accessing files. Agent tools remain subject to DSH's tool policy; do
not give untrusted agents permission to manage skills.

本插件会修改本地文件，不是只读插件。浏览器管理接口在读取请求体前使用 DSH
Connection 校验 Host、Origin、凭据和 owner 身份；Agent 工具仍受 DSH 工具策略约束。
这些校验不把 Skill 内容变成可信代码，也不替代宿主系统的文件权限和备份。

| Operation / 操作 | File access and consequence / 文件与影响 |
| --- | --- |
| Import / 导入 | Reads a user-selected local Skill path or uploaded content; copies it into the managed library. A local path may be outside the current workspace. |
| Collections / 收藏夹 | Reads/writes `$DSH_HOME/skill-collections/collections/*.yml`; changing a collection may resync registered workspaces that use it. |
| Workspace bindings / 工作区绑定 | Reads/writes `<workspace>/.dsh/skill-collections.yml` and managed links under `<workspace>/.dsh/skills`. |
| Global enable/disable / 全局启停 | Creates/removes plugin-managed links under `$DSH_HOME/skills`; global changes can affect other sessions. |
| Adopt global / 收纳全局 Skill | Moves the selected existing global Skill into the library; this is an explicit mutating action. |
| Delete / 删除 | May remove managed library content; referenced-content deletion requires force confirmation. Back up original Skills before destructive actions. |

The default `DSH_HOME` is `~/.dsh`; optional plugin configuration can change it.
Normal unload/uninstall removes runtime registrations, **not user Skills,
collections, workspace configuration or already-created links**. Keep data or
disable/remove managed links deliberately before removing the plugin.

默认 `DSH_HOME` 为 `~/.dsh`。卸载不会主动删除 Skill、收藏夹、工作区配置或已有链接；
如需撤销技能挂载，应先通过管理功能移除相应绑定。不要把卸载当成用户数据回滚。

## Dependencies and external services

- The sole ordinary runtime dependency is **`yaml@2.9.0`**, ISC licensed, from
  `https://registry.npmjs.org/`. It parses/writes local collection and binding
  YAML. It has no runtime dependency chain or install lifecycle script.
- DSH SDK packages, React and React DOM are shared peers supplied by DSH, not
  private SDK copies. They are not silently bundled as a way to avoid review.
- The source repository has exactly one `package-lock.json`, including fixed
  development resolutions. The public archive derives a runtime-only
  `npm-shrinkwrap.json` with package identity, registry URL and integrity intact.
- The plugin has no telemetry, remote Skill marketplace, model endpoint or
  secret-store integration. Browser requests target its same-origin DSH API;
  native DSH services provide the session catalog and local-path opening.
- Installing dependencies may contact the configured npm registry. Consumer
  packages have no install/prepare/build hooks; developer build tooling and its
  optional native binaries are not shipped as runtime dependencies.

唯一普通运行依赖是固定的 `yaml@2.9.0`。源码锁和公开包锁各自对应自身包身份，保留
下载完整性证据；这不等于商城已完成供应链批准。插件运行时不向外部服务上传 Skill
内容，不读取模型凭据；安装阶段仍可能访问 npm registry。

## Failures and limitations

- Authentication failure rejects requests; missing prerequisites block plugin
  activation rather than bypassing checks. Responses are marked `no-store`.
- Invalid names, unsupported layouts and path traversal are rejected by import
  and management validation. Existing same-name user files are not overwritten
  merely to establish a managed link.
- Permission errors, unavailable paths and malformed configuration can stop an
  operation. Multi-workspace updates are not a filesystem-wide transaction;
  errors can leave a partial update that needs an explicit sync/retry.
- Imported Skill text is untrusted model-facing content. Importing does not
  automatically execute it; enabling it can influence future agent behavior.
- This release's reproducible Profile evidence is separate from browser visual
  acceptance and from DSH STORE admission. A high-permission file-management
  plugin can correctly remain `user-reviewed` or `blocked`.

Report security issues through the repository's GitHub issues, without posting
credentials, private Skill contents or personal filesystem dumps. Prefer a
minimal reproduction using disposable data.
