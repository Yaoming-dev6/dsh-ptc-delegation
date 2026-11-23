# dsh-ptc-delegation

English: a session preset and installer for DeepSeek Harness 0.2.2-rc.5. After install, choose **PTC 委派模式** to use the built-in PTC preset with workflow enabled (plan mode is not included). This is a community workaround, not an official fix, and it does not restore the missing `subagent` tool.

本仓库提供会话预设 **「PTC 委派模式」**（id: `ptc-workflow`）和安装脚本。装好后，在 DeepSeek Harness 里新建会话并选择该预设即可。当前版本：**0.1.0**，适用于 DSH Desktop `0.2.2-rc.5`。

## 它提供什么

安装脚本会把预设追加到目标 profile 的 `cordis.patch.yml`，并先写备份。预设以内置 PTC 为底，打开 `workflow`，让模型在 `run_code` 里可以通过 `workflow` 做委派。

它不修改 DSH 本体，也不恢复 PTC 会话里可能缺失的 `subagent` 直调。启用 workflow 不是官方 PTC 的默认组合，使用风险自担。

## 和内置 PTC 的差别

对照官方标签 `dsh-v0.2.2-rc.5` 的内置 ptc 预设：

- 新的预设 id 与名称：`ptc-workflow` / 「PTC 委派模式」
- 启用 `workflow-ptc` 与 `tool-workflow`（内置 ptc 里这两项是关闭的）
- 复制时没有带 `planning` 组（plan mode）。如果需要，请自行加回

其余插件行与官方该版本的 ptc 预设一致。详细观察见 [docs/rc5-subagent-regression.md](docs/rc5-subagent-regression.md)；其中关于委派工具为何未注册的说明是社区观察，不是已核验的官方缺陷结论。

## 兼容范围

适用于 DeepSeek Harness Desktop `0.2.2-rc.5`。DeepSeek Harness 仍是开发者预览，后续版本可能不兼容。

截至 2026-11-23（Asia/Shanghai）已独立核对：

- 在 macOS、DSH Desktop `0.2.2-rc.5` 上，用 `install.mjs --file` 写入 desktop 的 `cordis.patch.yml` 后，正常退出并重开应用，新的空会话预设列表里可以看到并选中「PTC 委派模式」。
- 在隔离的空配置文件上，安装、重复安装跳过、卸载都能按预期工作，卸载后文件可精确恢复。

交付方称也在 Windows 的 `0.2.2-rc.5` 上验证过；本次没有再做一次独立的 Windows 界面加载。

未独立测试：模型调用，以及 `workflow` / `agent()` / `parallel()` / 后台任务的运行时行为。未在其他 DSH 版本上核对界面加载。本说明只反映上述有限范围，不把界面可见写成委派能力已证实。

## 安装

需要 Node.js 18 或更高版本。文档建议只安装到正在使用的 desktop profile。脚本本身没有改；如果不加参数，它仍会处理所有已有 `cordis.patch.yml` 的 profile。

建议的安装方式：

```bash
node install.mjs --profile desktop --dry-run
node install.mjs --profile desktop
```

也可以只指定一个文件：

```bash
node install.mjs --file ~/.dsh/profiles/desktop/cordis.patch.yml
```

检查是否已安装：

```bash
node install.mjs --profile desktop --verify
```

Windows 上若用命令行，请同样加上 `--profile` 或 `--file`。双击 `install.cmd` 会按脚本默认处理全部 profile，除非改为使用上面的命令。

脚本会先备份为 `cordis.patch.yml.bak-<时间戳>`，再追加带起止标记的预设块。如果目标文件内容只有 `[]`，会用预设块整体替换它。备份文件名精确到秒；同一秒内再次安装或卸载，可能覆盖同名备份。改正在使用的配置前，建议再自行另存一份备份。

不加 `--profile` 或 `--file` 时，`node install.mjs` 会扫描 `~/.dsh/profiles` 下所有已有 `cordis.patch.yml` 的 profile。若你有多个 profile，先用 `--dry-run` 确认范围。

装好后请重启 DSH（或重载插件），再**新建会话**，在预设里选择「PTC 委派模式」。不要只在已经开着的会话里中途改模式，来判断是否生效。

## 卸载

建议只卸载目标 profile：

```bash
node install.mjs --profile desktop --remove
# 或
node install.mjs --file ~/.dsh/profiles/desktop/cordis.patch.yml --remove
```

不加 `--file` 或 `--profile` 时，`--remove` 会处理所有 profile。Windows 上双击 `uninstall.cmd` 同样是脚本的默认卸载范围。也可以手动删掉 `cordis.patch.yml` 里起止标记之间的内容，然后重启 DSH。

## 注意事项

- 子智能体的模型路由、深度和并发由 `workflow` 以及 DSH 自己的 subagent 设置决定。这些运行时行为尚未经本仓库的独立测试。
- 如果后续版本修复了 `subagent` 注册问题，本预设里本来就声明了 `tool-subagent`，届时也可能一起出现该工具；这不是本补丁的目标。
- 本仓库只是配置补丁和安装脚本，不包含 DSH 本体代码。

## License

MIT。版权声明为 `Copyright (c) 2026 dsh-ptc-delegation contributors`，以及 `Portions Copyright (c) 2026 DeepSeek`。`preset/ptc-workflow.patch.yml` 派生自官方 DeepSeek Harness 内置 ptc 预设（标签 `dsh-v0.2.2-rc.5`）。全文见 [LICENSE](LICENSE)。
