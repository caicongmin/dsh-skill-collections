# DSH STORE review notes — 0.1.4

Canonical source: <https://github.com/caicongmin/dsh-skill-collections>.
This document supports review; it is **not an admission approval**.

## Fixed findings

| Finding | Remediation |
| --- | --- |
| Repository identity | `repository.url` uses the canonical `git+https` GitHub URL; source and public package point at the same repository. |
| Compatibility missing | `engines.node`: `^22.19.0 \|\| >=24.0.0`; `engines.dsh`: `>=0.2.1-rc.2 <0.3.0`. The runtime evidence records the exact tested versions, not every version in these ranges. |
| Dependency resolution missing | `yaml` is pinned to `2.9.0`; a unique source `package-lock.json` records registry/integrity and development resolutions. The public archive carries its own projected runtime `npm-shrinkwrap.json`, not both competing locks. |
| Incomplete Client modules/CSS | `files` selects only complete Host/Client JS bundles, maps and declarations. Intermediate `lib/client/*.js` are not shipped. The real browser entry inlines CSS and exposes the package's matching ModuleLoader ID. |
| Permission/failure boundaries | [Security notes](../SECURITY.md) document local writes, global changes, dependency provenance, lack of external runtime services and partial-failure limits. HTTP management requires an authenticated owner. |

The source development package keeps its scoped identity. The public npm archive
uses `dsh-skill-collections` consistently in the manifest, bundle patch and
browser registration. Neither packaging path installs or publishes itself.

## Reproduce from source

Run inside this plugin checkout, with DSH's build prerequisites available:

```bash
export DSH_CHECKOUT=/path/to/deepseek-harness
npm run build
npm run build:client
npm test
npm run typecheck
npm pack --ignore-scripts
npm run pack:npm
npm run verify:npm -- ./dsh-external-dsh-skill-collections-0.1.4.tgz
npm run verify:npm -- ./release/dsh-skill-collections-0.1.4.tgz
npm run verify:profile -- --checkout "$DSH_CHECKOUT" \
  --archive ./dsh-external-dsh-skill-collections-0.1.4.tgz \
  --archive ./release/dsh-skill-collections-0.1.4.tgz \
  --evidence ./docs/evidence/profile-0.1.4.json
```

The verifier uses fresh, owned temporary HOME/DSH_HOME and workspace directories.
It invokes official Profile installation/removal commands with scripts disabled,
starts each variant in a new process using the exported DSH Profile boot API at
a random loopback port, checks saved assembly, tools, authenticated API, anonymous
rejection and browser entry delivery, then removes the bundle and cold-starts
again to verify absence. It cleans up its owned processes and directories.
It does not install into the user's running Profile or open a browser window.

Actual redacted evidence is tracked separately in the source repository at
[`docs/evidence/profile-0.1.4.json`](https://github.com/caicongmin/dsh-skill-collections/blob/main/docs/evidence/profile-0.1.4.json).
It is deliberately excluded from the archive whose hash it records, avoiding a
self-referential archive hash. Missing or failed evidence must not be described
as a passing runtime check. Browser-rendered appearance is not established by
these API/resource checks.

## Remaining marketplace decision

The ordinary `yaml` dependency still requires the marketplace's independent
supply-chain review under its current policy. File-management permissions also
require guarded treatment. A valid lockfile, documentation and successful local
Profile verification do **not** authorize us to mark the project approved.
After the fix reaches the default branch, DSH STORE must perform its own
fixed-Commit recheck and admission decision.

中文说明：此次修复处理仓库身份、兼容范围、锁文件和发布模块缺失，提供可复现的
隔离安装／冷启动／卸载证据。`yaml` 供应链与高权限文件管理仍由商城独立审核；
技术检查通过不等于上架批准。验证使用临时 Home，不向当前使用中的 Profile 安装。
