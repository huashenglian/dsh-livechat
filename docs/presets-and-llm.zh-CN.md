# 预设包与 LLM

[English](./presets-and-llm.md) | [中文](./presets-and-llm.zh-CN.md)


浮动评论的来源：内置预设包（事件感知抽样）+ 可选 LLM 生成即时吐槽——带确保安全的降级。

## 预设包

内置三包（`lib/presets.js`），每条带标签，便于按事件抽取相关氛围：

| 包 | 风格 | 示例 |
|---|---|---|
| `general` | 通用围观 hype/cheer/work | 前方高能 · agent 开冲！ · 这波稳了 · 泪目 · 爷青回 |
| `coding` | 编程向 | 编译通过！ · 测试全绿 · 类型体操大师 · 边界条件拿捏 · 一次过 |
| `casual` | 摸鱼/情绪 | 摸鱼围观中 · 咖啡续命中 · 躺平看 agent 干活 · awsl · 建议循环播放 |

设置里选 `presetPack`。LLM 关闭时预设是唯一来源。

## 事件触发抽样

每个事件映射到突发条数与偏好标签：

| 事件 | 突发数 | 标签偏向 |
|---|---|---|
| `user_message` | 3 | hype / watch / work |
| `reply_complete` | 2 | praise / cheer / work |
| `tool_call` | 1 | work / code / watch |
| `task_done` | 4 | cheer / praise / hype |

`samplePresets()` 按标签命中与**疲劳度**（本会话已播出次数）给每条打分，无放回加权抽样。越复读的条权重越低——长会话不会循环同五条。

## LLM 弹幕（可选）

`llmEnabled: true`（默认开）让 LLM 生成突发评论。Host 构造 prompt，包含：

- 你的 `stylePrompt`（或选定的**风格模板**）
- 近期对话行（有上限，隐私裁剪）
- 近期事件类型

请求 `llmBurstCount` 条短字符串（JSON 数组），防御式解析（代码块、裸数组、甚至换行分割行），过 `blockedWords` 与 48 字符上限，标记 `source: 'ai'` 上屏。

### 风格模板

五个内置风格模板，在设置卡一键切换 LLM"嗓音"：

| id | 名称 | Prompt |
|---|---|---|
| `tucao` | 吐槽 | 吐槽风格，短促有力，偶尔阴阳怪气但友善 |
| `praise` | 称赞 | 夸张称赞，像看到神仙操作的围观群众 |
| `cheer` | 应援 | 热血应援，短句高能，像粉丝打call |
| `science` | 科普 | 用一两句通俗话点评技术点，有趣不装 |
| `repeat` | 复读机 | 简短重复热梗，像弹幕复读机 |

也可用自由文本 `stylePrompt` 覆盖。

### 唤醒模式

`wakeupType` 决定 LLM **何时**真正运行（而非只返回预设）：

| 模式 | 触发条件 | 适用场景 |
|---|---|---|
| `smart`（默认） | 配置的 `wakeupEvents`（默认 `user_message`、`reply_complete`），受 `smartMinGapSec` 与 `globalMinGapSec` 约束 | 想让 LLM 评论对齐真实活动 |
| `interval` | 固定 `llmIntervalSec` 节奏（`intervalOnlyWhenActive` 时仅活跃期） | 想要稳定滴注、不关心事件 |
| `toolcall` | 每次匹配 `toolcallFilterMode`（`all`/`whitelist`/`blacklist` 于 `toolcallTools`）的工具调用；`toolcallOnErrorExtra` 在出错时额外触发 | 想评论特定工具使用 |

所有模式共享 `globalMinGapSec` 节流，LLM 永不被打满。

**长思考与警告**

- streams of reasoning-only（`reasoning-delta`）记为软活动 `thinking`：可配置 `thinkingAsActive` 是否计入活跃（默认是，interval 不退避）。生成 prompt 按 `thinkingExcerptChars`（默认 240）附带最近思考片段。
- 截断（`max-tokens`）与 notice 告警 → `warning`；`warningAlwaysWake`（默认开）始终唤醒；覆盖层可弹 SC。
- **Token/API 统计**：从会话事件提取 usage（输入/输出/缓存命中），写入 prompt（`contextSources.usage`）。

**可读数据源（`contextSources`）**

| 键 | 默认 | 含义 |
|---|---|---|
| `conversation` | true | 最近对话摘要 |
| `thinking` | true | 思考片段 |
| `warning` | true | 警告/截断文案 |
| `usage` | true | Token/统计 |
| `tools` | true | 最近工具名 |
| `events` | true | 事件类型列表 |

关闭某项即不喂给弹幕 LLM。

**静默退避（`backoff*`）**

`interval` 心跳在静默期按 `backoffBaseSec` → ×`backoffFactor` 递增，上限 `backoffMaxSec`；活跃时长 ≥`backoffResetSec` 则重置。`backoffEnabled: false` 关闭。

设置页「唤醒高级」「可读数据源」为**收纳栏**，默认折叠，减少滚动。

### 安全降级

LLM 调用可能失败（无 provider、超时、解析错误、断网）。失败时 host **静默**降级到预设突发，标记 `source: 'preset'`、`reason: 'llm-fallback'`。无报错弹窗，覆盖层不中断——弹幕继续飘。

> [!NOTE]
> LLM prompt 禁止泄露密钥/路径或剧透后续步骤。输出还受 `styleMaxChars`（默认 24）截断并过 `blockedWords`。

## 屏蔽词

`blockedWords`（字符串数组）对预设与 LLM 输出做大小写不敏感匹配，命中即在上屏前丢弃。

## 相关配置

| 字段 | 默认 | 范围 | 作用 |
|---|---|---|---|
| `presetPack` | general | general/coding/casual | 预设选择 |
| `llmEnabled` | true | 布尔 | LLM 生成总开关 |
| `llmModel` | `-` | `-` 或 provider/model | LLM 模型 id；`-` 表示不使用 LLM |
| `llmBurstCount` | 5 | 1–20 | 每次突发条数 |
| `llmIntervalSec` | 18 | 5–120 | interval 模式节奏 |
| `stylePrompt` | 吐槽风格… | 字符串 | 自由 LLM 风格 |
| `styleMaxChars` | 24 | 8–48 | 单条字符上限 |
| `styleTemplates` | 5 个内置 | 数组 | 命名风格预设 |
| `wakeupType` | smart | smart/interval/toolcall | LLM 触发策略 |
| `wakeupEvents` | user_message, reply_complete | 子集 | smart 模式触发 |
| `smartMinGapSec` | 8 | 3–60 | smart 模式最小间隔 |
| `globalMinGapSec` | 5 | 1–60 | 全局 LLM 节流 |
| `toolcallFilterMode` | all | all/whitelist/blacklist | 工具过滤模式 |
| `toolcallTools` | [] | 字符串数组 | 过滤用工具名 |
| `toolcallOnErrorExtra` | true | 布尔 | 工具出错时额外突发 |
| `blockedWords` | [] | 字符串数组 | 内容过滤 |
| `density` | 3 | 1–5 | 整体生成密度 |

完整参考见 [configuration.md](configuration.md)。
