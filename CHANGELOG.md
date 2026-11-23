# Changelog

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
