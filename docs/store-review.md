# DSH STORE review notes — 0.1.5 (unreleased)

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
| HTTP authentication visibility | The real handler uses official `Connection.requestRejection()` before inspecting the admitted owner principal. Both denial gates run before body parsing and file access. |
| Test/production scope | The disposable Profile installer is an explicit integration test under `tests/integration`, not a production runtime module or a default unit test. Production does not install/remove DSH bundles or rewrite Profile package/patch files. |

The source development package keeps its scoped identity. The public npm archive
uses `dsh-skill-collections` consistently in the manifest, bundle patch and
browser registration. Neither packaging path installs or publishes itself.

## Immutable published baseline

The previous public release, **0.1.4**, is traceable to:

- Source Commit: [`155b4c87b9dd0d6b6b99317dda4e8950e0ee2092`](https://github.com/caicongmin/dsh-skill-collections/tree/155b4c87b9dd0d6b6b99317dda4e8950e0ee2092).
- Published package: [`dsh-skill-collections@0.1.4`](https://www.npmjs.com/package/dsh-skill-collections/v/0.1.4).
- Public archive SHA-256: `09fb5f9f378084a187dd091dba025b93981ce7a45c4920811932f0f69d992410`.
- [Fixed baseline Profile evidence](https://github.com/caicongmin/dsh-skill-collections/blob/155b4c87b9dd0d6b6b99317dda4e8950e0ee2092/docs/evidence/profile-0.1.4.json).

These identify **0.1.4 only**, not the current 0.1.5 working tree. The latter is
not yet committed or published. Its final archives have their own hashes and
must receive a new fixed-Commit review after source synchronization; neither an
old source SHA nor an earlier intermediate archive may be substituted.

## Reproduce from source

Run inside this plugin checkout, with DSH's build prerequisites available:

```bash
export DSH_CHECKOUT=/path/to/deepseek-harness
VERSION=$(node -p "require('./package.json').version")
npm run build
npm run build:client
npm test
npm run typecheck
npm pack --ignore-scripts
npm run pack:npm
npm run verify:npm -- "./dsh-external-dsh-skill-collections-${VERSION}.tgz"
npm run verify:npm -- "./release/dsh-skill-collections-${VERSION}.tgz"
npm run verify:profile -- --checkout "$DSH_CHECKOUT" \
  --archive "./dsh-external-dsh-skill-collections-${VERSION}.tgz" \
  --archive "./release/dsh-skill-collections-${VERSION}.tgz" \
  --evidence "./docs/evidence/profile-${VERSION}-local.json"
```

The `verify:profile` command explicitly runs
`tests/integration/verify-disposable-profile.mjs`. It is not part of the shipped
runtime or the default unit-test glob. Use a new evidence filename on each run;
existing evidence is never overwritten.

The verifier uses fresh, owned temporary HOME/DSH_HOME and workspace directories.
It invokes official Profile installation/removal commands with scripts disabled,
starts each variant in a new process using the exported DSH Profile boot API at
a random loopback port, checks saved assembly, tools, authenticated API, anonymous
rejection and browser entry delivery, then removes the bundle and cold-starts
again to verify absence. It cleans up its owned processes and directories.
It does not install into the user's running Profile or open a browser window.
Before runtime startup it also invokes official `--dump-config` inside the same
isolated environment and checks that the installed package appears in the
composed tree. Only success booleans, not the configuration dump, enter evidence.

Actual redacted evidence is tracked separately in the source repository at
[`docs/evidence/profile-0.1.5.json`](https://github.com/caicongmin/dsh-skill-collections/blob/main/docs/evidence/profile-0.1.5.json).
The first authentication-only pass is retained separately as
[`profile-0.1.5-initial.json`](https://github.com/caicongmin/dsh-skill-collections/blob/main/docs/evidence/profile-0.1.5-initial.json); it refers to
intermediate archives, not the final artifacts. The earlier 0.1.4 record remains
historical evidence for the published baseline above.
It is deliberately excluded from the archive whose hash it records, avoiding a
self-referential archive hash. Missing or failed evidence must not be described
as a passing runtime check. Browser-rendered appearance is not established by
these API/resource checks.

## Remaining marketplace decision

### Permission and provenance review inputs

| Signal | Actual scope and review material |
| --- | --- |
| Files | User-selected imports; the managed library/collections; registered workspace bindings; plugin-managed global Skill links. Adoption and destructive deletion are explicit mutating operations. Exact paths, propagation and partial-failure behavior are documented in [SECURITY.md](../SECURITY.md). |
| Network | Browser requests use the same-origin DSH management API behind Host/Origin, credential and owner checks. There are no external runtime services, telemetry or remote Skill uploads. Dependency installation can contact the configured npm registry. |
| Supply chain | `yaml@2.9.0`, ISC licensed, is the sole ordinary runtime dependency. Source lock and public runtime shrinkwrap preserve registry and integrity; DSH SDK/React remain shared peers. No consumer lifecycle/build hooks are shipped. |
| Profile lifecycle | No production bundle/package operations. Only the manually invoked integration test installs/removes bundles, under an owned temporary HOME/DSH_HOME with scripts disabled, and verifies fresh-process startup and post-removal absence. |

These are review inputs, not self-issued permission or supply-chain approval.

The ordinary `yaml` dependency still requires the marketplace's independent
supply-chain review under its current policy. File-management permissions also
require guarded treatment. A valid lockfile, documentation and successful local
Profile verification do **not** authorize us to mark the project approved.
After the fix reaches the default branch, DSH STORE must perform its own
fixed-Commit recheck and admission decision.

中文说明：此次修复处理仓库身份、兼容范围、锁文件和发布模块缺失，提供可复现的
隔离安装／冷启动／卸载证据。`yaml` 供应链与高权限文件管理仍由商城独立审核；
技术检查通过不等于上架批准。验证使用临时 Home，不向当前使用中的 Profile 安装。
