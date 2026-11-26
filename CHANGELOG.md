# Changelog

## 0.2.0 — 2026-11-26

从「安装脚本 + 手动补丁」升级为**可安装插件（DSH bundle）**。

### 变更

- 打包为 bundle：`package.json` 声明 `dsh.bundle.patch`，新增 `locale/en.json`、`locale/zh.json`、`icon.svg`，`engines.dsh` 限定 `>=0.2.2-rc.5 <0.2.3-0`（宿主升到 0.2.3 后拒绝安装）。
- 预设补丁移到仓库根 `cordis.patch.yml`（删除 `preset/ptc-workflow.patch.yml`）；`install.mjs` 同步指向新路径，其余脚本行为未改。
- 预设内容 6 处改动：
  1. 补回 `planning` 组（plan mode）——0.1.0 从内置 ptc 复制时整组漏掉了；
  2. `workflow-ptc` 增加 `maxConcurrentAgents: 6`、`maxTotalAgents: 200`（原默认 `0`＝按 CPU 并行度、`1000`）；
  3. 预设 `order: 3` → `5`（内置 `minimal` 的 order 也是 3）；
  4. `skill-filesystem` 增加 `customSkillDirs`，指向安装目录内的官方技能（如 `dsh-doc`）；
  5. `tool-plugin-manager` 由 `disabled: true` 改为 `!!js "!ctx.get('profileContext')"`；
  6. `persona` 追加 `Prefer the workflow tool for independent parallel subtasks.`。
- LICENSE 保留 `Portions Copyright (c) 2026 DeepSeek`：预设派生自官方 `dsh-v0.2.2-rc.5` 内置 ptc 预设。

### 迁移

- 0.1.0 用户先运行 `node install.mjs --remove` 清掉 profile 里的旧补丁，再安装 bundle；否则会出现两个 `config.id: ptc-workflow`，预设声明加载失败。

### 验证（本次，Windows / DSH Desktop `0.2.2-rc.5`，交付方环境）

- `plugin_manager install_bundle` 安装成功（`application: applied`，无 pending build scripts）；Plugins 中 bundle 为 `dsh-ptc-delegation 0.2.0`、`enabled: true`；
- 组合后的配置只注册一行该预设（`preset-ptc-workflow`），没有重复；
- `cordis.patch.yml` 通过 YAML 解析（含 `!!js`）：顶层 1 条、`config.id = ptc-workflow`、`order = 5`、24 个插件、`planning.isolate.planMode = true`。

未核对：新会话选中预设后的运行时行为（plan 模式、`workflow` / `agent()` / `parallel()`、技能目录是否出现 `dsh-doc`）；插件标题/描述/图标的界面渲染；macOS 上的本版本安装。

## 0.1.0 — 2026-11-23

首个版本。

- 新增预设「PTC 委派模式」（id: `ptc-workflow`）：以 DSH `0.2.2-rc.5` 内置 ptc 预设为底，启用 `workflow-ptc` 与 `tool-workflow`，未包含 `planning` 组。
- 安装脚本 `install.mjs`：备份后把预设追加到 `cordis.patch.yml`，支持 `--dry-run` / `--verify` / `--remove` / `--profile` / `--file`。
- 文档：README，以及社区观察笔记 `docs/rc5-subagent-regression.md`。

兼容与限制：

- 不恢复可能缺失的 `subagent` 直调。
- 适用于 DSH Desktop `0.2.2-rc.5`。已在 macOS 上核对：用 `--file` 写入 desktop 后重启应用，新空会话可以看到并选中该预设；隔离文件上的安装与卸载可精确恢复。交付方称在 Windows 上验证过，本次未再做独立的 Windows 界面加载。未独立测试模型调用，也未独立测试 `workflow` / `agent()` / 并行 / 后台的运行时行为。
- 默认不加参数时，安装和卸载会处理全部 profile；备份文件名精确到秒，同一秒内的再次写入可能覆盖同名备份。脚本行为未改，README 建议改用 `--profile desktop`。
- 其他 DSH 版本未声称可用。
