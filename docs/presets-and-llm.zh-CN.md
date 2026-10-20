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

用 `presetsEnabled: false`（默认 `true`）可整体关闭预设功能。关闭后：环境预设、事件突发、host 的 LLM 兜底全部停止——只剩 LLM 弹幕。（0.6.13 起池回放只回放 AI，预设行本来就不会回放。）开关即时生效（无需刷新）并像其它设置一样持久化。

### 预设包编辑器（0.6.10 起）

设置卡「内容」区的「编辑…」打开预设包编辑器，可增删包、改包名与弹幕行。

- **保存只有一处**：编辑器**没有自己的保存按钮**，它只改「弹幕 Live Chat」卡片的草稿。只有该窗口右下角的 **保存** 才会 `PUT /api/danmaku/presets` 真正落盘。关闭编辑器不丢草稿。
- **撤销只有一条路**：卡片右下角的 **撤销**，或直接**关闭「弹幕 Live Chat」窗口**（草稿随组件丢弃，什么都不写盘）。编辑器内部不提供任何撤销入口。
- **删包是「暂存」而非立即删除**：点红色垃圾桶 → 二次确认（红题 + 包名）→ 包从草稿里移除（基础分区的预设包下拉同步少一项），但**服务器与磁盘完全没动**；只有按了卡片 **保存** 才真正删除。删除后若当前 `presetPack` 指向被删的包，会自动改指到剩下的第一个包，避免留下悬空引用。
- 删除的包会立刻停止参与抽样：`applyPresetStore()` 改为**整体重建**运行时包表（原先只增不减），因此保存后本会话就不再抽到它，不必等重启。

### 导入与列表视图（0.6.12 起）

预设包编辑器标题行现在是三段：**导入** ｜ **文本 / 列表** 开关（与标题平齐）。

**双视图**

- 默认视图按行数决定：**> 500 行进列表视图**，否则进文本视图（每次切包重算；导入后越过 500 行也会立即切到列表）。2 万行的包不会退化成一个约 1MB 的 textarea。
- 文本态先把每行过 `normalizePresetLine` 再用换行 join（**先规整再 join**），含换行的条目不会裂成两条；textarea 写回时同样逐行规整，只丢空串（单字弹幕「6」「顶」保留）。
- 两个视图都是受控组件，改动即时写回草稿；切换视图只清空选择集并重置页码，互转**无损耗**。

**列表视图**

| 元素 | 行为 |
|---|---|
| 搜索栏 | 大小写不敏感的**子串匹配**；**先过滤全集再分页**，所以搜索跨页，命中数与页数都按过滤后结果算 |
| `全选筛选结果(N)` | 只选中**当前筛选结果**的跨页全集（不是全库） |
| `删除所选(N)` | 按底层行索引删除 |
| 每行 `[checkbox][输入框][×]` | 勾选框用于批量；输入框改文本即时写回；`×` 删该行 |
| `＋ 新增条目` | 在末尾追加一条空行 |
| 页码条 + `每页` | 单页容量存 localStorage `dsh-danmaku-preset-page-size`，**默认 50，钳 10..500**（不入配置，只在本机浏览器生效） |

两条容易踩的语义：

- **单行内容清空不会删行**（D15）。空行保留下来，输入框边框标红，只有 `×` 或「删除所选」会真正移除它。自动删行会让下方所有已选索引整体前移，批量删除就会删错行。
- **全选 = 当前筛选结果**（D16）。按钮上写的是命中数，选中什么一目了然。

**文件导入**

支持 `.txt` / `.csv` / `.tsv` / `.json` / `.jsonl` / `.ndjson` / `.xml`（B站 `<d>` 弹幕），按**小写扩展名**（去掉 `?query` / `#hash`）分派：

| 扩展名 | 解析方式 |
|---|---|
| `.json` | `JSON.parse`。数组元素是字符串则直用；是对象则按 `barrage → text → content → line → msg → message` 优先级取第一个字符串字段。也接受字符串根与单个对象 |
| `.jsonl` / `.ndjson` | 逐行 `JSON.parse`，规则同上；解析失败的行只计入 `failed` |
| `.csv` / `.tsv` | RFC 4180，取**每条记录的第一个字段**（双引号包裹、`""` 转义、CRLF、引号内换行都支持；未闭合引号按吃到文本末尾处理） |
| `.xml` | 提取 `<d …>text</d>` 的文本，做最小实体反转义（`&lt;` `&gt;` `&quot;` `&#39;` `&#x27;` `&nbsp;` `&amp;`） |
| 其他（含 `.txt` 与无扩展名） | 按换行切分 |

导入的全部重活都在后端：`POST /api/danmaku/presets/import`（详见 [configuration.zh-CN.md](configuration.zh-CN.md)），浏览器只负责把文件读成文本。

- **去重口径**：`trim → NFC 归一 → 精确比较`（**区分大小写**）。同时与「当前包已有条目」和「本批已收」比对，`add` 保持文件里的原顺序。
- **追加，不覆盖**：新条目追加到该包 `lines` 末尾，旧条目一个都不动。
- **行规整**：去 BOM 与 C0/C1 控制符（emoji 不受影响）、**条目内换行与制表符折叠为单个空格**、trim。唯一丢弃条件是「规整后为空」；超过 48 字符**不丢弃不截断**，只计入 `overChars` 提示（48 只是导入侧的软提示；LLM 路径的硬上限由 `contentMaxChars` 控制，默认 200，8–2000）。
- **结果三段计数**：新增 = `add.length`；已存在 = `dupExisting + dupInFile`；跳过 = `droppedShort + failed`。
- **只改草稿**：导入同样不落盘，落盘仍只有底栏「保存」。

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

请求 `llmBurstCount` 条短字符串（JSON 数组），防御式解析（代码块、裸数组、甚至换行分割行），过 `blockedWords` 与 200 字符上限，标记 `source: 'ai'` 上屏。

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

LLM 调用可能失败（无 provider、超时、解析错误、断网）。失败时 host **静默**降级到预设突发，标记 `source: 'preset'`、`reason: 'llm-fallback'`。无报错弹窗，覆盖层不中断——弹幕继续飘。降级突发只用于当前显示，不写入弹幕池。（`presetsEnabled: false` 时没有可降级的预设：host 返回 `items: []` / `reason: 'presets-disabled'`，弹幕池不写入。）

> [!NOTE]
> LLM prompt 禁止泄露密钥/路径或剧透后续步骤。输出还受 `contentMaxChars`（默认 200）截断并过 `blockedWords`；`styleMaxChars`（默认 24）只写进提示词请 LLM 保持短句，本身不截断。

## 屏蔽词

`blockedWords`（字符串数组）对预设与 LLM 输出做大小写不敏感匹配，命中即在上屏前丢弃。

## 相关配置

| 字段 | 默认 | 范围 | 作用 |
|---|---|---|---|
| `presetsEnabled` | true | 布尔 | 预设功能总开关；关闭后只剩 LLM（不生成预设、不降级；AI 回放继续） |
| `presetPack` | general | general/coding/casual | 预设选择 |
| `llmEnabled` | true | 布尔 | LLM 生成总开关 |
| `llmModel` | `-` | `-` 或 provider/model | LLM 模型 id；`-` 表示不使用 LLM |
| `llmBurstCount` | 5 | 1–20 | 每次突发条数 |
| `llmIntervalSec` | 18 | 5–120 | interval 模式节奏 |
| `stylePrompt` | 吐槽风格… | 字符串 | 自由 LLM 风格 |
| `styleMaxChars` | 24 | 8–200 | 「LLM 弹幕字数上限」：仅提示词，不截断（真实硬上限是 `contentMaxChars`，默认 200） |
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
