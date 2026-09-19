# 配置与 API

[English](./configuration.md) | [中文](./configuration.zh-CN.md)


设置卡 UI、每个配置字段的默认值与范围、Host 暴露的完整 HTTP API。

## 设置卡 UI

入口：**设置 → 插件 → 插件配置 →「弹幕 Live Chat」**卡片（settings key `danmaku`）。卡片由 Host 注册 `danmaku` 设置命名空间：新版 dsh 走 `settings.installSection`，`0.1.1-rc.2` 等尚未提供该 seam 的版本回退到 `settings.register`。

卡片按关注点分组：

1. **通用**——开关、透明度、空闲透明度、防遮挡、同屏上限、字号、穿屏秒数、滚动速度、滚动区、布局权重、白色描边、悬停暂停
2. **内容**——预设包、屏蔽词、密度、环境间隔、允许 emoji
3. **LLM**——启用 LLM、模型、突发数、刷新间隔、唤醒模式 + smart 事件 + 间隔、工具过滤、风格 prompt + 字符上限、风格模板
4. **颜色**——统一颜色、颜色、颜色权重弹窗
5. **会话池**——上限、历史回放 + 数量 + 最大年龄、半衰期、归档、恢复窗口、打开池编辑器
6. **效果**——入场欢迎、任务完成刷屏、工具出错吐槽、热度条、调试来源
7. **高级**——渲染后端

点 **保存**经 `POST /api/danmaku/config` 持久化，**双写**两处：

| 位置 | 内容 | 角色 |
|---|---|---|
| `$DSH_HOME/danmaku-config.json` | `{version, savedAt, config}`（完整配置） | **启动时的权威来源**，同步写入，不依赖 settings 服务 |
| `$DSH_HOME/settings.yaml` 的 `danmaku:` 段 | 仅与默认值不同的键 | 可见 / 可手工编辑；外部编辑会被热采纳并回写镜像 |

**dsh 重启后配置不会重置**：启动顺序为「镜像 → settings 段 → 内置默认」，镜像与 settings 段都缺失（首次运行）时用默认值并立即写入镜像。响应里的 `persisted` 字段报告两处写入结果；若镜像写入失败，卡片提示会变红（`savedNoDisk`）而不是假装保存成功。

覆盖层轮询 `GET /api/danmaku/config`（约 700ms），改动实时生效无需刷新。

UI 双语（zh/en），随宿主语言切换。

## 配置字段参考

所有字段位于 `danmaku` 设置命名空间。写入时由 `clampConfig()` 裁剪。

### 通用 / 显示

| 字段 | 默认 | 范围/类型 | 作用 |
|---|---|---|---|
| `enabled` | true | 布尔 | 总开关 |
| `opacity` | 0.85 | 0.1–1.0 | 活跃亮度 |
| `opacityIdle` | 0.15 | 0–0.8 | 空闲亮度 |
| `antiOcclude` | true | 布尔 | 平息渐暗 |
| `maxOnscreen` | 40 | 1–200 | 同屏节点上限 |
| `fontSize` | 16 | 12–36 | px |
| `crossSec` | 8 | 3–20 | 穿屏秒数 |
| `scrollSpeed` | 140 | 40–400 | px/s（覆盖穿屏推导） |
| `areaRatio` | 0.5 | 0.25–1.0 | 滚动轨高度比例 |
| `layoutWeights` | `{roll:80,top:10,bottom:10}` | 各 0–100 | 滚/顶/底权重 |
| `stroke` | true | 布尔 | 白色描边 |
| `hoverPause` | true | 布尔 | 悬停冻结 |
| `userSend` | true | 布尔 | 允许手发 |
| `allowEmoji` | true | 布尔 | 允许 emoji |

### 颜色

| 字段 | 默认 | 范围/类型 | 作用 |
|---|---|---|---|
| `uniformColor` | false | 布尔 | 全统一色 |
| `color` | #FFFFFF | `#RRGGBB` | 统一色 |
| `colorWeights` | `[{#FFFFFF,40},{#1a1a1a,30},{#89D5FF,15},{#FFFF00,10},{#FB7299,5}]` | `{color,weight}` 数组 | 加权颜色抽取 |

> [!NOTE]
> `colorWeights` 在 Host（`lib/index.js`）与 Client（`lib/client.js`）默认值略有不同——Client 加了深色 `#1a1a1a` 权重以适配浅色主题可读性。运行时以 HTTP 合并值为准。

### 内容

| 字段 | 默认 | 范围/类型 | 作用 |
|---|---|---|---|
| `presetPack` | general | general/coding/casual | 预设选择 |
| `blockedWords` | [] | 字符串数组 | 屏蔽词（大小写不敏感） |
| `density` | 3 | 1–5 | 生成密度 |
| `ambientMinMs` | 500 | 400–10000 | 环境最小间隔 (ms) |
| `ambientMaxMs` | 1400 | ≥min+200, ≤20000 | 环境最大间隔 (ms) |
| `styleMaxChars` | 24 | 8–48 | 单条字符上限 |

### LLM

| 字段 | 默认 | 范围/类型 | 作用 |
|---|---|---|---|
| `llmEnabled` | true | 布尔 | LLM 总开关 |
| `llmModel` | `-` | `-` 或 provider/model | 模型 id；`-` 表示不使用 LLM |
| `llmBurstCount` | 5 | 1–20 | 每次突发数 |
| `llmIntervalSec` | 18 | 5–120 | interval 节奏 |
| `stylePrompt` | 吐槽风格，短促有力 | 字符串 | 自由风格 |
| `styleTemplates` | 5 个内置 | `{id,name,prompt}` 数组 | 命名风格 |
| `wakeupType` | smart | smart/interval/toolcall | 唤醒策略 |
| `wakeupEvents` | [user_message, reply_complete] | 子集 | smart 触发 |
| `smartMinGapSec` | 8 | 3–60 | smart 最小间隔 |
| `intervalOnlyWhenActive` | true | 布尔 | 仅活跃时 interval |
| `globalMinGapSec` | 5 | 1–60 | 全局节流 |
| `toolcallFilterMode` | all | all/whitelist/blacklist | 工具过滤 |
| `toolcallTools` | [] | 字符串数组 | 工具名 |
| `toolcallOnErrorExtra` | true | 布尔 | 出错额外突发 |
| `matchThreshold` | 0.35 | 0–1 | 历史回放标签匹配下限 |

### 会话池

| 字段 | 默认 | 范围/类型 | 作用 |
|---|---|---|---|
| `maxPoolEntries` | 200 | 20–2000 | 单会话上限 |
| `historyReplayEnabled` | true | 布尔 | 回放旧条目 |
| `historyReplayMax` | 12 | 0–50 | 每轮最多回放 |
| `historyMaxAgeHours` | 72 | 1–720 | 回放年龄上限 |
| `halfLifeDays` | 7 | 0.5–30 | 衰减半衰期 |
| `archiveAfterDays` | 60 | 1–365 | 归档年龄 |
| `restoreMaxAgeHours` | 168 | 1–720 | 恢复窗口 |

### 效果与调试

| 字段 | 默认 | 范围/类型 | 作用 |
|---|---|---|---|
| `welcomeOnEnter` | true | 布尔 | 入场欢迎 |
| `taskDoneRain` | true | 布尔 | 任务完成刷屏 |
| `toolErrorSc` | true | 布尔 | 工具出错吐槽 |
| `showHeat` | true | 布尔 | 显示热度条 |
| `debugSource` | false | 布尔 | 来源徽章前缀 📺/🤖/💬 |
| `debugLogs` | false | 布尔 | 开启后终端才打印 llm call / llm raw 等日志 |

### 高级

| 字段 | 默认 | 范围/类型 | 作用 |
|---|---|---|---|
| `renderBackend` | auto | auto/dom/webgl2/webgl2-main/webgl2-worker | 渲染器（仅 `dom`/`auto`→`dom` 已实现） |

---

## HTTP API

所有路由 `kind: 'exact'`（path 唯一）。GET/POST 同 handler 按 `req.method` 分支。Base：<http://127.0.0.1:3080>。

### 健康与配置

| 方法 | 路径 | Body/Query | 返回 |
|---|---|---|---|
| GET | `/api/danmaku/health` | — | `{ok, name, version, storage:{mirror, settings}}`（`settings` 为 `registered` 或未注册原因） |
| GET | `/api/danmaku/config` | — | `{config}` |
| POST | `/api/danmaku/config` | `{config:{...}}` 或补丁字段 | `{config, persisted:{file, settings, settingsReason}}`（合并裁剪；写镜像 + settings 段） |

### 触发

| 方法 | 路径 | Query | 返回 |
|---|---|---|---|
| GET | `/api/danmaku/triggers` | `since=<ms>` | `{triggers:[{id,kind,at,sessionId,meta}], now}` |

### 生成

| 方法 | 路径 | Body | 返回 |
|---|---|---|---|
| POST | `/api/danmaku/generate` | `{event?, sessionId?}` | `{items, source:'ai'\|'preset', reason?}`（节流→上次；LLM 失败→预设） |
| POST | `/api/danmaku/preset-sample` | `{event?, count?, sessionId?}` | `{items}` |
| GET | `/api/danmaku/models` | — | `{groups:[{provider, models}]}` |
| GET | `/api/danmaku/heat` | `window=<秒>`（默认 30） | `{heat:0..1, events, windowSec, score}` |

### 会话池

| 方法 | 路径 | Query/Body | 返回 |
|---|---|---|---|
| GET | `/api/danmaku/pools` | — | `{sessions:[{sessionId, title, live, archived, oldest, newest}]}`（`title` 取自会话标题折叠，见下） |
| GET | `/api/danmaku/pool` | `sessionId=`，`scope=live\|archive\|all` 或 `stats=1` | `stats=1`→统计；`scope`→`{items, sessionId, scope}`；否则历史回放打分项 |
| PATCH | `/api/danmaku/pool/item` | `{sessionId, id, content?, weight?, tags?}` | `{ok, scope}` |
| DELETE | `/api/danmaku/pool/item` | `{sessionId, id, scope?}` | `{ok, scope}` |
| POST | `/api/danmaku/pool/restore` | `{sessionId, id}` | `{ok, item}` 或 `{ok:false, reason}`（too_old 返 403） |
| POST | `/api/danmaku/pools/clear` | — | `{ok, removed}`（清空全部会话 live+archive 池文件） |
| POST | `/api/danmaku/like` | `{sessionId?, content}` | `{ok, liked}`（提升 likes+weight；不存在则追加） |

### 示例：切换预设包

```bash
curl -X POST http://127.0.0.1:3080/api/danmaku/config \
  -H 'Content-Type: application/json' \
  -d '{"config":{"presetPack":"coding"}}'
```

### 示例：强制 LLM 突发

```bash
curl -X POST http://127.0.0.1:3080/api/danmaku/generate \
  -H 'Content-Type: application/json' \
  -d '{"event":"task_done"}'
```
