# Configuration & API

[English](./configuration.md) | [中文](./configuration.zh-CN.md)


The settings card UI, every config field with default and range, and the full HTTP API the host exposes.

## Settings card UI

Find it at **Settings → Plugins → Plugin config → "Live Chat Danmaku"** card (settings key `danmaku`). The host registers the `danmaku` settings namespace: newer dsh goes through `settings.installSection`, while versions without that seam (e.g. `0.1.1-rc.2`) fall back to `settings.register`.

The card groups controls by concern:

1. **General** — enabled, opacity, idle opacity, anti-occlude, max on-screen, font size, cross seconds, scroll speed, roll area, layout weights, white stroke, hover pause
2. **Content** — preset pack, blocked words, density, ambient interval, allow emoji
3. **LLM** — enable LLM, model, burst count, refresh interval, wake mode + smart events + gaps, tool filter, style prompt + max chars, style templates
4. **Color** — uniform color, color, color weights modal
5. **Session pool** — max entries, history replay + count + max age, half-life, archive after, restore window, open pool editor
6. **Effects** — welcome on enter, task-done rain, tool-error banner, show heat, debug source
7. **Advanced** — render backend

Click **Save** to persist via `POST /api/danmaku/config`, which writes to **two** places:

| Location | Content | Role |
|---|---|---|
| `$DSH_HOME/danmaku-config.json` | `{version, savedAt, config}` (the full config) | The **authoritative source at boot**; written synchronously, independent of the settings service |
| the `danmaku:` section of `$DSH_HOME/settings.yaml` | only keys differing from defaults | Visible and hand-editable; external edits are adopted live and mirrored back |

**A dsh restart never resets the configuration**: boot resolves mirror → settings section → built-in defaults, and a first run (neither present) writes the mirror immediately. The response's `persisted` field reports both writes; when the mirror write fails the card says so (`savedNoDisk`) instead of pretending the save succeeded.

The overlay polls `GET /api/danmaku/config` (~700ms) so changes apply live without a reload.

The UI is bilingual (zh/en) and picks the locale from the host.

## Config field reference

All fields live under the `danmaku` settings namespace. Values are clamped on write by `clampConfig()`.

### General / display

| Field | Default | Range / type | Effect |
|---|---|---|---|
| `enabled` | true | bool | Master switch |
| `opacity` | 0.85 | 0.1–1.0 | Active brightness |
| `opacityIdle` | 0.15 | 0–0.8 | Idle (reading) brightness |
| `antiOcclude` | true | bool | Fade to idle when quiet |
| `maxOnscreen` | 40 | 1–200 | Hard cap on live DOM nodes |
| `fontSize` | 16 | 12–36 | px |
| `crossSec` | 8 | 3–20 | Seconds for roll item to cross |
| `scrollSpeed` | 140 | 40–400 | px/s (overrides crossSec-derived speed) |
| `areaRatio` | 0.5 | 0.25–1.0 | Roll track height fraction |
| `layoutWeights` | `{roll:80,top:10,bottom:10}` | 0–100 each | roll/top/bottom spawn weights |
| `stroke` | true | bool | White text stroke for readability |
| `hoverPause` | true | bool | Freeze item on hover |
| `userSend` | true | bool | Allow user-sent danmaku |
| `allowEmoji` | true | bool | Allow emoji in content |

### Color

| Field | Default | Range / type | Effect |
|---|---|---|---|
| `uniformColor` | false | bool | Single color for all items |
| `color` | #FFFFFF | `#RRGGBB` | Color when uniform |
| `colorWeights` | `[{#FFFFFF,40},{#1a1a1a,30},{#89D5FF,15},{#FFFF00,10},{#FB7299,5}]` | array of `{color,weight}` | Weighted color pick (higher = more often) |

> [!NOTE]
> `colorWeights` differ slightly between host (`lib/index.js`) and client (`lib/client.js`) defaults — the client adds a dark `#1a1a1a` weight for light-theme legibility. The HTTP-merged value wins at runtime.

### Content

| Field | Default | Range / type | Effect |
|---|---|---|---|
| `presetPack` | general | general/coding/casual | Preset selection |
| `blockedWords` | [] | string[] | Content filter (case-insensitive) |
| `density` | 3 | 1–5 | Overall spawn density |
| `ambientMinMs` | 500 | 400–10000 | Min ambient spawn gap (ms) |
| `ambientMaxMs` | 1400 | ≥min+200, ≤20000 | Max ambient spawn gap (ms) |
| `styleMaxChars` | 24 | 8–48 | Per-comment char cap |

### LLM

| Field | Default | Range / type | Effect |
|---|---|---|---|
| `llmEnabled` | true | bool | LLM generation master switch |
| `llmModel` | `-` | `-` or provider/model | LLM model id; `-` disables LLM generation |
| `llmBurstCount` | 5 | 1–20 | Comments per burst |
| `llmIntervalSec` | 18 | 5–120 | Interval-mode cadence |
| `stylePrompt` | 吐槽风格，短促有力 | string | Free-form LLM voice |
| `styleTemplates` | 5 built-in | array of `{id,name,prompt}` | Named voice presets |
| `wakeupType` | smart | smart/interval/toolcall | LLM trigger strategy |
| `wakeupEvents` | [user_message, reply_complete] | subset of user_message/reply_complete/tool_call/task_done/tool_error | Smart-mode triggers |
| `smartMinGapSec` | 8 | 3–60 | Smart-mode min spacing |
| `intervalOnlyWhenActive` | true | bool | Interval only while active |
| `globalMinGapSec` | 5 | 1–60 | Global LLM throttle |
| `toolcallFilterMode` | all | all/whitelist/blacklist | Tool-call filter mode |
| `toolcallTools` | [] | string[] | Tool names for filter |
| `toolcallOnErrorExtra` | true | bool | Extra burst on tool errors |
| `matchThreshold` | 0.35 | 0–1 | History replay tag-match floor |

### Session pool

| Field | Default | Range / type | Effect |
|---|---|---|---|
| `maxPoolEntries` | 200 | 20–2000 | Per-session pool cap |
| `historyReplayEnabled` | true | bool | Replay old pool entries |
| `historyReplayMax` | 12 | 0–50 | Max replayed per cycle |
| `historyMaxAgeHours` | 72 | 1–720 | Replay age cutoff |
| `halfLifeDays` | 7 | 0.5–30 | Replay decay half-life |
| `archiveAfterDays` | 60 | 1–365 | Move to archive after |
| `restoreMaxAgeHours` | 168 | 1–720 | Restore window |

### Effects & debug

| Field | Default | Range / type | Effect |
|---|---|---|---|
| `welcomeOnEnter` | true | bool | Welcome burst on session enter |
| `taskDoneRain` | true | bool | Confetti rain on task done |
| `toolErrorSc` | true | bool | Scold burst on tool error |
| `showHeat` | true | bool | Show heat bar |
| `debugSource` | false | bool | Prefix 📺/🤖/💬 source badges |
| `debugLogs` | false | bool | When on, host prints llm call / llm raw logs to the terminal |

### Advanced

| Field | Default | Range / type | Effect |
|---|---|---|---|
| `renderBackend` | auto | auto/dom/webgl2/webgl2-main/webgl2-worker | Renderer (only `dom`/`auto`→`dom` implemented) |

---

## HTTP API

All routes are `kind: 'exact'` (path-unique). GET/POST share a handler per path and branch on `req.method`. Base URL: <http://127.0.0.1:3080>.

### Health & config

| Method | Path | Body / query | Returns |
|---|---|---|---|
| GET | `/api/danmaku/health` | — | `{ok, name, version, storage:{mirror, settings}}` (`settings` is `registered` or the reason it is not) |
| GET | `/api/danmaku/config` | — | `{config}` (clamped live config) |
| POST | `/api/danmaku/config` | `{config: {...}}` or patch fields | `{config, persisted:{file, settings, settingsReason}}` (merged + clamped; writes the mirror and the settings section) |

### Triggers

| Method | Path | Query | Returns |
|---|---|---|---|
| GET | `/api/danmaku/triggers` | `since=<ms>` | `{triggers:[{id,kind,at,sessionId,meta}], now}` |

### Generation

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/danmaku/generate` | `{event?, sessionId?}` | `{items:[{content,tags,source}], source:'ai'|'preset', reason?}` (throttled → last burst; LLM fail → preset fallback) |
| POST | `/api/danmaku/preset-sample` | `{event?, count?, sessionId?}` | `{items:[{content,tags,source:'preset'}]}` |
| GET | `/api/danmaku/models` | — | `{groups:[{provider, models:[{id,name}]}]}` |
| GET | `/api/danmaku/heat` | `window=<sec>` (default 30) | `{heat:0..1, events, windowSec, score}` |

### Session pools

| Method | Path | Query / body | Returns |
|---|---|---|---|
| GET | `/api/danmaku/pools` | — | `{sessions:[{sessionId, title, live, archived, oldest, newest}]}` (`title` is the folded session title — see below) |
| GET | `/api/danmaku/pool` | `sessionId=`, `scope=live\|archive\|all` or `stats=1` | `stats=1` → pool stats; `scope` → `{items, sessionId, scope}`; else history-replay scored items |
| PATCH | `/api/danmaku/pool/item` | `{sessionId, id, content?, weight?, tags?}` | `{ok, scope:'live'\|'archive'}` |
| DELETE | `/api/danmaku/pool/item` | `{sessionId, id, scope?}` | `{ok, scope}` |
| POST | `/api/danmaku/pool/restore` | `{sessionId, id}` | `{ok, item}` or `{ok:false, reason:'too_old'\|'not_found'}` (403 on too_old) |
| POST | `/api/danmaku/pools/clear` | — | `{ok, removed}` (deletes all session live+archive pool files) |
| POST | `/api/danmaku/like` | `{sessionId?, content}` | `{ok, liked}` (bumps likes+weight; appends if absent) |

### Example: change preset pack

```bash
curl -X POST http://127.0.0.1:3080/api/danmaku/config \
  -H 'Content-Type: application/json' \
  -d '{"config":{"presetPack":"coding"}}'
```

### Example: force an LLM burst

```bash
curl -X POST http://127.0.0.1:3080/api/danmaku/generate \
  -H 'Content-Type: application/json' \
  -d '{"event":"task_done"}'
```
