# dsh-ptc-delegation

English: a DeepSeek Harness **bundle** that adds a “PTC delegation mode” preset for `0.2.2-rc.5`. After install, choose **PTC 委派模式** in a new session: PTC sessions get `workflow`-based delegation, plan mode, and a bounded workflow concurrency. Community workaround, not an official fix; it does not restore the missing `subagent` tool.

本仓库提供**可安装插件（DSH bundle）**：新增会话预设 **「PTC 委派模式」**（`config.id`：`ptc-workflow`）。当前版本 **0.2.0**，适用 DeepSeek Harness Desktop `0.2.2-rc.5`。装好后新建会话并选择该预设即可。

0.1.0 是「安装脚本 + 手动补丁」；0.2.0 改为插件安装，并补上了 0.1.0 缺失的几项（见下）。

## 0.2.0 的变化

- **改为 DSH bundle**：`package.json` 声明 `dsh.bundle.patch`，可在 **Plugins → Add plugin**（或 `plugin_manager install_bundle`）安装；`engines.dsh` 限定 `>=0.2.2-rc.5 <0.2.3-0`，宿主升到 0.2.3 后会被拒绝安装。
- **预设相对 0.1.0 的改动**：
  1. 补回 `planning` 组（plan mode）——0.1.0 未包含；
  2. `workflow-ptc` 并发封顶：`maxConcurrentAgents: 6`、`maxTotalAgents: 200`（原默认 `0`＝按 CPU 并行度、`1000`）；
  3. 预设 `order: 3` → `5`（内置 `minimal` 的 order 也是 3）；
  4. `skill-filesystem` 增加 `customSkillDirs`，指向安装目录内的官方技能（如 `dsh-doc`）；
  5. `tool-plugin-manager` 改为 `!!js "!ctx.get('profileContext')"`（与内置 standard/cordis 一致）；
  6. `persona` 追加 `Prefer the workflow tool for independent parallel subtasks.`。
- 预设补丁从 `preset/ptc-workflow.patch.yml` 移到仓库根 `cordis.patch.yml`；`install.mjs` 的预设路径随之更新，其余脚本行为未改。
- 新增 `locale/en.json`、`locale/zh.json`、`icon.svg` 作为插件展示元数据。

## 它提供什么

安装后新增一个会话预设，以内置 PTC 为底，打开 `workflow`，让模型在 `run_code` 里通过 `workflow`（`agent()` / `parallel()` / `pipeline()`）做委派；同时带上 plan mode 与 workflow 并发上限。

它不修改 DSH 本体，也不恢复 PTC 会话里可能缺失的 `subagent` 直调。启用 workflow 不是官方 PTC 的默认组合，使用风险自担。

## 和内置 PTC 的差别

对照官方标签 `dsh-v0.2.2-rc.5` 的内置 ptc 预设：

- 新的预设 id 与名称：`ptc-workflow` / 「PTC 委派模式」
- 启用 `workflow-ptc` 与 `tool-workflow`（内置 ptc 里这两项是关闭的）
- 0.2.0 起包含 `planning` 组（plan mode）；0.1.0 未包含
- workflow 引擎参数、预设排序、技能目录、插件管理开关、persona 共 5 处差异（见上）

其余插件行与官方该版本的 ptc 预设一致。详细观察见 [docs/rc5-subagent-regression.md](docs/rc5-subagent-regression.md)；其中关于委派工具为何未注册的说明是社区观察，不是已核验的官方缺陷结论。

## 兼容范围与验证状态

适用于 DeepSeek Harness Desktop `0.2.2-rc.5`。DSH 仍是开发者预览，后续版本可能不兼容。`workflow` 运行需要 `danger-full-access`：rc5 的 Node PTC 运行时在没有系统隔离的环境只接受该模式，`read-only` / `workspace-write` 会在启动前失败。

**0.2.0 本次已核对**（Windows，DSH Desktop `0.2.2-rc.5`，交付方环境）：

- `plugin_manager install_bundle` 安装成功（`application: applied`，无 pending build scripts）；Plugins 中 bundle 为 `dsh-ptc-delegation`、版本 `0.2.0`、`enabled: true`；
- 组合后的配置里只注册一行该预设（`preset-ptc-workflow`），没有重复；
- `cordis.patch.yml` 通过 YAML 解析（含 `!!js`）：顶层 1 条、`config.id = ptc-workflow`、`order = 5`、24 个插件、`planning.isolate.planMode = true`。

**0.2.0 未核对**：新会话里选中该预设后的运行时行为（plan 模式、`workflow` / `agent()` / `parallel()`、技能目录是否出现 `dsh-doc`）；插件标题/描述/图标在界面中的实际渲染；macOS 上本版本的安装。

**0.1.0 的历史核对记录（保留）**：在 macOS、DSH Desktop `0.2.2-rc.5` 上，用 `install.mjs --file` 写入 desktop 的 `cordis.patch.yml` 后正常退出并重开应用，新的空会话预设列表里可以看到并选中「PTC 委派模式」；在隔离的空配置文件上，安装、重复安装跳过、卸载都能按预期工作，卸载后文件可精确恢复。交付方称也在 Windows 的 `0.2.2-rc.5` 上验证过。未独立测试模型调用，以及 `workflow` / `agent()` / `parallel()` / 后台任务的运行时行为。

## 安装（作为插件）

1. **Plugins → Add plugin**，选择本仓库目录；或让 agent 调用
   `plugin_manager { action: "install_bundle", target: "<本仓库绝对路径>" }`。
2. **重启 DSH**。
3. 新建会话，在预设里选择 **「PTC 委派模式」**。

### 从 0.1.0 升级：先卸掉旧补丁

0.1.0 的脚本会往 profile 里粘一段预设。那段还在的话，装 bundle 后会出现两个 `config.id: ptc-workflow`，**预设声明会加载失败**。先执行：

```bash
node install.mjs --remove
```

确认 `node install.mjs --verify` 显示「未安装」后再装 bundle。

## 安装（手动补丁，保留旧方式）

把仓库根 `cordis.patch.yml` 的整段内容追加到：

```
~/.dsh/profiles/<profile>/cordis.patch.yml
```

（Windows：`%USERPROFILE%\.dsh\profiles\<profile>\cordis.patch.yml`；文件只有 `[]` 时整体替换。）

或用脚本：`node install.mjs --profile desktop`（先备份为 `cordis.patch.yml.bak-<时间戳>`，再加带起止标记的补丁块）。需要 Node.js 18 或更高版本。

Windows 上用命令行时同样加 `--profile` 或 `--file`；双击 `install.cmd` 会按脚本默认处理全部 profile。备份名精确到秒，同一秒内重复写入可能覆盖同名备份；改动正在使用的配置前，建议再自行另存一份。

装好后请重启 DSH，再**新建会话**选择预设；不要用已经开着的会话来判断是否生效。

## 验证

装完重启，新开会话选「PTC 委派模式」，逐项确认：

1. 工具列表里有 `workflow`；
2. 模式切换里有 **plan**，进计划模式后能 `exit_plan_mode`；
3. 技能列表里出现 **dsh-doc**；
4. 跑一个最小 workflow：

```js
const a = await agent('用一句中文回答：2+2 等于几？', { provider: 'deepseek-official', model: 'deepseek-flash' });
return a;
```

5. Plugins 里本 bundle 的标题、描述、图标在中文和英文下都正常显示。

## 卸载

- 插件方式：Plugins 里移除该 bundle，或 `plugin_manager { action: "remove_bundle", target: "dsh-ptc-delegation" }`，然后重启。
- 手动方式：`node install.mjs --profile desktop --remove`（或 `--file <path> --remove`），或删掉 `cordis.patch.yml` 里起止标记之间的内容，然后重启。不加 `--profile` / `--file` 时 `--remove` 会处理所有 profile。

## 注意事项

- 子智能体的模型路由、深度和并发由 `workflow` 以及 DSH 自己的 subagent 设置决定。这些运行时行为尚未经本仓库的独立测试。
- 技能目录用 `DSH_INSTALL_DIR` 定位安装目录内的 `@deepseek-ai/dsh-agent-preset/skills`；若某种启动方式没有该变量，这条技能根会被跳过（其余技能根不受影响）。
- 如果后续版本修复了 `subagent` 注册问题，本预设里本来就声明了 `tool-subagent`，届时也可能一起出现该工具；这不是本补丁的目标。
- 本仓库只是配置补丁（bundle）、展示元数据与安装脚本，不包含 DSH 本体代码。

## License

MIT。版权声明为 `Copyright (c) 2026 dsh-ptc-delegation contributors`，以及 `Portions Copyright (c) 2026 DeepSeek`。`cordis.patch.yml` 派生自官方 DeepSeek Harness 内置 ptc 预设（标签 `dsh-v0.2.2-rc.5`）。全文见 [LICENSE](LICENSE)。
