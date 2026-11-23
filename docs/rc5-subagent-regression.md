# DSH 0.2.2-rc.5：PTC / 标准模式丢失委派工具的观察

> 观察时间：2026-11-23 · 环境：DSH Desktop `0.2.2-rc.5`（Windows）
> 结论基于会话日志与本机配置比对，属于社区观察，不代表 DSH 官方结论。

## 摘要

- rc5 更新后，**PTC 会话和标准（原生工具）会话都少了整组委派工具**：`subagent`、`subagent_fork`、`subagent_codex`、`subagent_claude_code`、`list_subagent_models`、团队任务工具等。
- 内置 `ptc` 预设又**显式禁用** `workflow-ptc` 与 `tool-workflow`。两件事叠加，PTC 会话就没有任何通用子智能体入口。
- `workflow` 在 PTC 里是**能工作**的：`agent()` 会起真正的子会话，并行 / 后台都验证过。
- 因此本仓库给出的补丁 = 复制内置 `ptc` 预设，只把 workflow 两行恢复启用，把 `workflow` 作为 PTC 的委派通道。
- 这不是"修复 `subagent`"；`subagent` 为什么没注册，尚未定位到根因。

## 两个概念

| 名称 | 含义 |
|---|---|
| **PTC 模式** | 工具执行器为 `@deepseek-ai/dsh-tool-executor-ptc`：模型只能直接调用 `run_code`，其余工具以 SDK 绑定形式在程序内调用。 |
| **PTC 委派模式** | 本仓库新增的预设（id: `ptc-workflow`）：与内置 `ptc` 相同，但启用 `workflow`，从而可以在 `run_code` 里通过 `workflow` 起子智能体。 |

## rc5 前后的对比

### 1) 内置 PTC 预设（`presets/ptc.patch.yml`）

rc.4 与 rc.5 的该文件**完全一致**，`workflow-ptc` 和 `tool-workflow` 都写着 `disabled: true`。
也就是说，"PTC 没有 workflow" 不是 rc5 新改的，是预设本身的取舍。

### 2) 委派工具在 rc5 后消失

同一台机器、同一个 profile：

| 时间点 | 会话类型 | 工具面 |
|---|---|---|
| rc5 安装前 | PTC | SDK 约 60 个绑定，含 `subagent` / `subagent_fork` / `list_subagent_models` |
| rc5 安装后 | PTC | 只有 `run_code` 直调；SDK 无 `subagent`；workflow 也未启用 |
| rc5 安装前 | 标准 | 67 个工具，含 `subagent` 等 |
| rc5 安装后 | 标准 | 60 个工具，`subagent` 等整组消失 |

消失的典型工具（标准模式对比）：

```
subagent
subagent_fork
subagent_codex
subagent_claude_code
list_subagent_models
spawn_teammate
team_task_create / team_task_get / team_task_list / team_task_update
```

（`interrupt_agent` 的缺席另有一个配置原因：`tool-subagent-control` 设了 `interrupt: false`。）

### 3) web 应用的预设分层

rc5 的 `dsh-web-app/cordis.patch.yml` 把 `tool-subagent`、`tool-subagent-fork`、`workflow-ptc`、`tool-workflow` 等**在宿主层禁用**，由各个预设自己挂载。
预设里确实写了 `tool-subagent`，但运行时会话里仍然没有注册成功——具体加载错误没有出现在会话日志里。

## workflow 在 PTC 里能用（实测）

- 在 `ptc-workflow` 预设的会话里，`tools.workflow` 正常暴露。
- 历史会话中 workflow 成功起过 `agent-1` … `agent-15` 等子会话，包含 `parallel()` 与后台 job。
- 最小验证：

```js
const a = await agent('用一句中文回答：2+2 等于几？', {
  provider: 'deepseek-official',
  model: 'deepseek-flash'
});
return a; // => "2+2=4"
```

## 如何自查

会话日志在：

```
~/.dsh/sessions/<workspace>/<session-id>/session.v4.jsonl.zstd
```

它是 zstd 分帧压缩的 JSONL。可以：

1. 解压后找 `agent-preset/selected`，确认预设是否 `ptc-workflow`；
2. 找 `system/message` 里的 `interface ToolArgsMap`，这就是 PTC 会话的 SDK 绑定清单；
3. 找 `request/header` 的 `tools[].name`，这就是原生会话的工具清单。

判断标准很简单：**清单里有没有 `subagent` / `workflow`**。

## 未决问题

- `tool-subagent` 在 rc5 里为什么没有注册：没有拿到插件加载错误日志。
- 可疑点之一：profile 的 `node_modules` 里可能残留旧版本（例如 rc.3）的 `@deepseek-ai/dsh-tool-subagent`，与 app 内 rc.5 并存。该猜测**未验证**。
- 如果后续版本修复了这个问题，本补丁的预设也会自动多出 `subagent`（因为预设里本来就声明了 `tool-subagent`）。

## 免责声明

本仓库只包含配置补丁，不修改 DSH 本体，也不绕过任何权限。`workflow` 在 PTC 中并非内置默认组合，使用风险自担。
