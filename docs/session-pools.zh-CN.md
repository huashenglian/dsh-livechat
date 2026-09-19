# 分会话弹幕库

[English](./session-pools.md) | [中文](./session-pools.zh-CN.md)


弹幕如何按会话记忆、衰减回放、归档、恢复与编辑——让弹幕像*你的*弹幕，而非随机噪声。

## 分会话 `.jsonl` 池

每个会话有独立弹幕池：

```
$DSH_HOME/danmaku-pools/<sessionId>.jsonl
```

（`$DSH_HOME` 默认 `~/.dsh`，Windows 上即 `C:\Users\<你>\.dsh`。）

每行一个 JSON 条目：`id`、`content`、`source`（preset/ai/user）、`at` 时间戳、`tags`、`weight`、`likes`。新评论（预设/LLM/手发）追加；池上限 `maxPoolEntries`（默认 200，裁最旧）。

> [!IMPORTANT]
> 会话被**用户删除**（`api-session/removed`）时池文件删除。`session/disposed`（内存驱逐，非用户删除）**不**删池——重新打开仍列表的会话仍有历史。
>
> **卸载插件**时若服务仍在运行，会清空整个 `danmaku-pools` 目录。也可在库编辑器右上角用红色「清空弹幕库」一键清空（二次确认），或 `POST /api/danmaku/pools/clear`。

## 历史回放

`historyReplayEnabled: true`（默认）让旧池条目作为环境弹幕重现，按以下打分：

- **时间衰减**——半衰期 `halfLifeDays`（默认 7）。越旧指数越低。
- **点赞加权**——每赞 `+15%`。
- **权重**——条目 `weight`（1–10，点赞时提升）。
- **标签匹配**——条目标签与当前上下文标签（近期事件 + 关键词）重叠度。低于 `matchThreshold`（默认 0.35）跳过。

前 `historyReplayMax`（默认 12）条高分回放。所以聊过"正则"的会话会重新浮现旧的正则相关弹幕。

## 点赞

点赞弹幕（`POST /api/danmaku/like`）提升其 `likes` 与 `weight`（上限 10），使其更常浮现。若被赞内容不在池中，作为点赞用户条目追加——可临时推广评论。

## 归档与恢复

为保持活跃池精简，超过 `archiveAfterDays`（默认 60）的条目移入**归档**子目录：

```
$DSH_HOME/danmaku-pools/archive/<sessionId>.jsonl
```

归档条目不参与活跃回放，但可通过池 API 查询（`scope=archive` 或 `scope=all`）。`restoreMaxAgeHours`（默认 168h / 7 天）内可**恢复**归档条目回活跃。超窗恢复返回 `too_old`，条目保持归档。

## 弹幕池编辑器

设置卡内置**池编辑器**（"Open pool editor…"）：

- 列出所有会话及其**真实会话名称**（如「帮我写一个……」）与活跃/归档数和时间范围——名称由 Host 通过 `ctx.sessionQuery.readTitleSnapshots()` 一次批量折叠会话标题得到（与 dsh 侧边栏会话列表同源；无标题时回退到截断的 sessionId）
- 按会话浏览活跃 + 归档
- 内联编辑内容/权重/标签
- 删除条目（活跃或归档）
- 恢复归档条目（窗口内）

所有编辑走池 HTTP 路由——无需手动改文件。

## 热度与池

`/api/danmaku/heat`（见 [interaction.md](interaction.md)）与池列表（`/api/danmaku/pools`）共同构成"谁在、多忙"的画面，覆盖层据此呼吸。
