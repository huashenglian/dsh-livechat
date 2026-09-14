# Presets & LLM

[English](./presets-and-llm.md) | [中文](./presets-and-llm.zh-CN.md)


Where the floating comments come from: built-in preset packs with event-aware sampling, and an optional LLM that writes fresh, context-aware quips — with a guaranteed safe fallback.

## Preset packs

Three packs ship in the box (`lib/presets.js`), each tagged so events can pull relevant vibes:

| Pack | Vibe | Example items |
|---|---|---|
| `general` | General围观 hype/cheer/work | 前方高能 · agent 开冲！ · 这波稳了 · 泪目 · 爷青回 |
| `coding` | Programming-focused | 编译通过！ · 测试全绿 · 类型体操大师 · 边界条件拿捏 · 一次过 |
| `casual` | Slack-off/mood | 摸鱼围观中 · 咖啡续命中 · 躺平看 agent 干活 · awsl · 建议循环播放 |

Pick one via `presetPack` in settings. When LLM is off, presets are the only source.

## Event-triggered sampling

Each event maps to a burst size and preferred tags:

| Event | Burst count | Tag bias |
|---|---|---|
| `user_message` | 3 | hype / watch / work |
| `reply_complete` | 2 | praise / cheer / work |
| `tool_call` | 1 | work / code / watch |
| `task_done` | 4 | cheer / praise / hype |

`samplePresets()` scores each candidate by tag-match and **fatigue** (how many times it already aired this session), then weighted-picks without replacement. The more an item has repeated, the lower its weight — so a long session never loops the same five comments.

## LLM danmaku (optional)

Flip `llmEnabled: true` (default on) to have an LLM generate burst comments. The host builds a prompt from:

- your `stylePrompt` (or a chosen **style template**)
- recent conversation lines (capped, privacy-trimmed)
- recent event kinds

It requests `llmBurstCount` short strings as a JSON array, parses defensively (fenced code blocks, bare arrays, or even newline-split lines), filters by `blockedWords` and a 48-char cap, and ships them tagged `source: 'ai'`.

### Style templates

Five built-in style templates let you swap the LLM's "voice" from the settings card:

| id | name | Prompt |
|---|---|---|
| `tucao` | 吐槽 | 吐槽风格，短促有力，偶尔阴阳怪气但友善 |
| `praise` | 称赞 | 夸张称赞，像看到神仙操作的围观群众 |
| `cheer` | 应援 | 热血应援，短句高能，像粉丝打call |
| `science` | 科普 | 用一两句通俗话点评技术点，有趣不装 |
| `repeat` | 复读机 | 简短重复热梗，像弹幕复读机 |

You can also override with a free-form `stylePrompt`.

### Wake modes

`wakeupType` decides **when** the LLM actually runs (vs. just returning presets):

| Mode | Triggers on | Use when |
|---|---|---|
| `smart` (default) | Configured `wakeupEvents` (default `user_message`, `reply_complete`), respecting `smartMinGapSec` and `globalMinGapSec` | You want LLM comments timed to real activity |
| `interval` | A fixed `llmIntervalSec` cadence (only while active, if `intervalOnlyWhenActive`) | You want a steady drip regardless of events |
| `toolcall` | Every tool call matching `toolcallFilterMode` (`all`/`whitelist`/`blacklist` on `toolcallTools`); `toolcallOnErrorExtra` fires extra on errors | You want commentary on specific tool usage |

All modes share a `globalMinGapSec` throttle so the LLM is never hammered.

### The safe fallback

LLM calls can fail (no provider, timeout, parse error, network). When they do, the host **silently** falls back to a preset burst tagged `source: 'preset'` with `reason: 'llm-fallback'`. No error popups, no broken overlay — the crowd keeps talking.

> [!NOTE]
> The LLM prompt forbids leaking secrets/paths or spoiling future steps. Output is also capped at `styleMaxChars` (default 24) and filtered by `blockedWords`.

## Blocked words

`blockedWords` (string array) is checked case-insensitively against both preset and LLM output. Any hit is dropped before it reaches the screen.

## Related config

| Field | Default | Range | Effect |
|---|---|---|---|
| `presetPack` | general | general/coding/casual | Preset selection |
| `llmEnabled` | true | bool | LLM generation master switch |
| `llmModel` | `-` | `-` or provider/model | LLM model id; `-` disables LLM generation |
| `llmBurstCount` | 5 | 1–20 | Comments per LLM burst |
| `llmIntervalSec` | 18 | 5–120 | Interval-mode cadence |
| `stylePrompt` | 吐槽风格… | string | Free-form LLM voice |
| `styleMaxChars` | 24 | 8–48 | Per-comment char cap |
| `styleTemplates` | 5 built-in | array | Named voice presets |
| `wakeupType` | smart | smart/interval/toolcall | LLM trigger strategy |
| `wakeupEvents` | user_message, reply_complete | subset | Smart-mode triggers |
| `smartMinGapSec` | 8 | 3–60 | Smart-mode min spacing |
| `globalMinGapSec` | 5 | 1–60 | Global LLM throttle |
| `toolcallFilterMode` | all | all/whitelist/blacklist | Tool-call filter mode |
| `toolcallTools` | [] | string[] | Tool names for filter |
| `toolcallOnErrorExtra` | true | bool | Extra burst on tool errors |
| `blockedWords` | [] | string[] | Content filter |
| `density` | 3 | 1–5 | Overall spawn density |

See [configuration.md](configuration.md) for the full reference.
