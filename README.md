# DSH Skill Collections

DSH Skill 收藏夹管理器。它把 Skill 内容、收藏夹定义与工作区绑定分开：

- **托管 Skill 库**：`$DSH_HOME/skill-collections/library`，不在 DSH 默认扫描根中，因此安装后不会自动污染所有项目。
- **收藏夹**：`$DSH_HOME/skill-collections/collections/*.yml`，只保存 Skill 名称引用。
- **工作区绑定**：`<workspace>/.dsh/skill-collections.yml`，由用户显式选择收藏夹或单个 Skill。
- **原生挂载**：插件将所选 Skill 安全地链接到 `<workspace>/.dsh/skills`，继续复用 DSH 自带的 Skill 发现和热加载。

插件不会检测 Unity、Python 或其他项目类型，也不会根据目录内容自动启用能力。

## 功能

- 设置页中的 **Skill 库 / 收藏夹 / 工作区** 三个视图。
- 在设置页直接选择根目录包含 `SKILL.md` 的 Skill 文件夹，内容会上传到固定托管库；无需填写目标路径。
- Agent 工具仍可用 `import_path` 从 Host 本机绝对路径导入目录型或平铺 Markdown Skill。
- 将已经位于 `~/.dsh/skills` 的全局 Skill“收纳”进隔离托管库。
- 托管 Skill 支持“设为全局 / 取消全局”：原件保留在托管库，全局目录只建立可审计链接；取消时不影响已有工作区绑定。
- 工作区“当前会话可用 Skill”与快捷选择复用原生 `/` 菜单的 `skills/list`，按真实会话 cwd 和预设作用域列出全部可手动调用技能，不限于托管库。
- 同一工作区可切换会话查看各自的目录；从输入框打开管理时优先使用当前会话，不默认跳到别的工作区。
- 创建、编辑、删除收藏夹；一个 Skill 可以被多个收藏夹引用。
- 对已注册工作区显式启用/停用收藏夹。
- 对工作区单独启用 Skill，或禁用收藏夹中的某个 Skill。
- 可用目录只读展示名称、描述、路径和“仅手动”策略；托管绑定诊断独立展示链接状态、缺失和冲突，不再冒充完整可用列表。
- `skill_collection_list` 与 `skill_collection_manage` Agent 工具。
- 管理清单只删除插件自己创建且仍指向原来源的链接；目标被用户替换时失败关闭，不覆盖也不递归删除。

### 全局技能的安全边界

- 全局链接归属保存在 `$DSH_HOME/skill-collections/global-links.manifest.json`，操作串行化以避免并发丢失记录。
- “设为全局”拒绝覆盖已有同名文件、目录或链接（包括目录型与平铺 Markdown 同名冲突）。
- “取消全局”只移除本插件登记且仍指向原来源的链接。外部全局原件保留原有“收纳”入口，不提供直接删除。
- 删除托管 Skill 前须先取消全局，强制删除也不会绕过此保护。
- 全局技能不参与工作区链接同步；工作区的“禁用覆盖”不能屏蔽全局技能。可用列表与快捷选择的同名优先级完全沿用原生会话目录，不由本插件另行排序覆盖。
- 全局开关只管理 DSH 全局目录中的托管链接；可用目录同时展示原生解析出的未托管、本地、共享用户目录、内置、预设与其他 provider 的有效技能。展示不会赋予插件额外的删除或禁用权限。
- 同名覆盖与用户调用策略由原生目录处理；仅模型可用但不可由用户调用的技能不伪装成可插入的 `/` 项。读取失败时明确报错，不退回不完整的托管列表。

## 配置格式

收藏夹：

```yaml
version: 1
id: unity-development
name: Unity 开发
description: Unity 开发常用流程
skills:
  - unity-coding
  - unity-debugging
```

工作区：

```yaml
version: 1
collections:
  - unity-development
skills:
  enabled: []
  disabled:
    - unity-performance
```

## npm / 预构建包安装（无需源码）

公开 npm 包名为 **`dsh-skill-collections`**。发布成功后可直接安装：

```bash
dsh plugin --profile web add dsh-skill-collections
```

安装指定版本可使用 `dsh-skill-collections@0.1.0`；更新后重启 DSH。安装包包含 Host、浏览器构建产物和 loader patch，不需要 clone、TypeScript、源码依赖或安装时编译。

尚未发布到 npm 时，可通过 `dsh plugin --profile web add <绝对路径的.tgz>` 安装预构建包。开发者在本目录运行 `npm run pack:npm` 生成公开包，再由已登录 npm 的 Windows 执行 `npm.cmd publish <包.tgz> --access public --registry=https://registry.npmjs.org/`；Linux 无需登录。完整步骤见仓库中的 [PUBLISHING.md](https://github.com/caicongmin/dsh-skill-collections/blob/main/PUBLISHING.md)。**打包成功不等于已发布。**

Git 开发包保留旧名 `@dsh-external/dsh-skill-collections`，公开包使用无前缀名；两者不能同时装配。已有源码/热注入安装请先按发布说明安全切换，不要直接叠加安装。Skill 数据目录保持不变。

## 独立 Git 安装与更新（开发模式）

本插件只在 `git@github.com:caicongmin/dsh-skill-collections.git` 同步源码和已有 `lib/` 产物，不再存入统一迁移仓库的插件快照。首次迁移：

```bash
git clone git@github.com:caicongmin/dsh-skill-collections.git /path/to/dsh-skill-collections
# 从目标机 DSH checkout 执行：
pnpm dsh plugin --profile web add "file:/path/to/dsh-skill-collections"
```

后续在插件 checkout 中执行 `git pull --ff-only origin main`，再从目标机 DSH 重复上述 `file:` 安装命令并重启 DSH。不要覆盖未提交修改，不复制旧机器的依赖或 SDK 链接。Skill 库、收藏夹仍从统一备份的 `bundle/skills/` 恢复，与插件代码更新分开。

每批实际插件修改同步递增 `package.json.version`，并更新 `CHANGELOG.md`；公开包由此版本生成，不维护两份版本号。纯备份/同步不重复升版，不自动发布 tag 或 Release。当前版本为 **0.1.0**，旧版 `.tgz` 不代表当前 checkout。

## 构建、测试与注入

```bash
DSH_CHECKOUT=<checkout> bash scripts/build.sh
npm run build:client
npm test
# 注入器环境内：dev_inject_plugin <本目录>
```

Host 构建先用 TypeScript 生成声明和可测试模块，再将 Host 入口中的插件本地逻辑打成单个 ESM 文件。这样入口热重载会带上同一代核心逻辑，避免复用旧的传递依赖缓存；共享依赖仍保持 external。

## 持久安装与冷启动

本包必须声明：

```json
{
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"
    }
  }
}
```

`dev_inject_plugin` 成功只代表当前进程可以动态加载，不代表 profile 重启可以加载。持久安装必须满足：

1. `package.json` 存在 `dsh.bundle.patch`；
2. patch 文件存在并插入本包 loader entry；
3. profile `dependencies` 中有本包 link；
4. profile `dsh.profile.bundles` 中本包只出现一次；
5. super-injector registry 中不再保留本包，避免 injected 实例与 bundle 实例同时注册 route/tool；
6. 使用全新进程完成冷启动验证。

从热注入切换到持久安装时，先退出 injected 通道，再执行 `dev_install_package`。不要让同一个包同时存在于 `dev_injected_list` 和 profile bundles。

本包的 `scripts/validate-manifest.mjs` 会在测试和构建前检查 bundle 声明，缺失时直接失败。

## 设计来源

管理界面和安全文件操作借鉴了 MIT 许可的 [`lcthe/dsh-skills-hub`](https://github.com/lcthe/dsh-skills-hub)；可逆作用域和路径防线参考了 [`fuxin123z/dsh-skill-manage`](https://github.com/fuxin123z/dsh-skill-manage)。本插件新增的核心是隔离 Skill 库、收藏夹引用、显式工作区绑定和可审计链接清单。
