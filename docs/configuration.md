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

**Gifts** (its own nav tab, right after **Danmaku pools**) — master switch, the gift config modal, asset store entry; see [Gift effects](./gift-effects.md).

### Save & undo model (since 0.6.10)

The card's bottom-right **Save** is the **only** writer for every sub-window. Sub-windows (preset pack editor, colour weights, style templates, emoji library…) now only mutate a draft — none of them owns a **Save** button any more:

- Anything you change in a sub-window lands in the card's draft and is **never written on the spot**; closing the sub-window keeps the draft.
- The footer shows *unsaved changes* whenever the draft differs from what is stored. Only **Save** actually commits (config via `POST /api/danmaku/config`, preset packs via `PUT /api/danmaku/presets`).
- There are exactly two ways back: the footer's **Undo**, or **closing the card** (the draft is dropped with the component, so nothing reaches disk). No sub-window offers an undo of its own.

The **More** menu (footer, pops upward) holds two red destructive entries, each behind a confirmation:

| Entry | Scope | Notes |
|---|---|---|
| **Reset all parameters** | Config values only | Returns configuration parameters (numbers, switches, text) to defaults. Danmaku pools, emoji, gift assets and custom presets are **not** affected — externally imported gift assets and emoji packs are never cleared |
| **Reset everything** | Parameters + every cache | Resets all plugin parameters and caches to the **clean state of a first-time install**: permanently deletes every danmaku pool, emoji, custom preset and config value. Gift assets are restored to the defaults (builtin assets + default gift cards) |

Click **Save** to persist via `POST /api/danmaku/config`, which writes to **two** places:

| Location | Content | Role |
|---|---|---|
| `$DSH_HOME/danmaku-config.json` | `{version, savedAt, config}` (the full config) | The **authoritative source at boot**; written synchronously, independent of the settings service |
| the `danmaku:` section of `$DSH_HOME/settings.yaml` | only keys differing from defaults | Visible and hand-editable; external edits are adopted live and mirrored back |

**A dsh restart never resets the configuration**: boot resolves mirror → settings section → built-in defaults, and a first run (neither present) writes the mirror immediately. The response's `persisted` field reports both writes; when the mirror write fails the card says so (`savedNoDisk`) instead of pretending the save succeeded.

The overlay polls `GET /api/danmaku/config` (~700ms) so changes apply live without a reload.

The UI is bilingual (zh/en) and picks the locale from the host.

### Input controls

Number fields are clamped inputs: while focused you can clear the box, and the value commits on blur — an empty box resolves to the field's lower bound, and an out-of-range entry is clamped to the nearest bound.

The **layout weights** (滚动 % / 顶部 % / 底部 %, i.e. `layoutWeights.roll` / `.top` / `.bottom`) are each a **slider plus a number input** bound together. Drag the slider to update the number, or type a number to move the slider. Both are clamped to 0–100.

The **long-text** fields are multiline **textareas** with a fixed height and internal scrolling (they don't auto-grow): 智能唤醒事件 (`wakeupEvents`), 屏蔽词 (`blockedWords`), 工具名列表 (`toolcallTools`), and LLM 风格提示词 (`stylePrompt`). Comma-list fields accept both `,` and `，` separators.

## Config field reference

All fields live under the `danmaku` settings namespace. Values are clamped on write by `clampConfig()`.

### General / display

| Field | Default | Range / type | Effect |
|---|---|---|---|
| `enabled` | true | bool | Master switch — turning it off shuts the whole plugin down: no danmaku, no gift effects, no gift tips, and a playing gift animation is deleted immediately |
| `opacity` | 0.85 | 0.1–1.0 | Active brightness |
| `opacityIdle` | 0.15 | 0–0.8 | Idle (reading) brightness |
| `antiOcclude` | true | bool | Fade to idle when quiet |
| `maxOnscreen` | 40 | 1–200 | Soft cap on live **ambient** danmaku (per renderer). While the master switch is on, gift tip danmaku are exempt (they may push `stats().onscreen` past this value) |
| `fontSize` | 16 | 12–36 | px |
| `crossSec` | 8 | 3–20 | Seconds for roll item to cross |
| `scrollSpeed` | 140 | 40–400 | px/s (overrides crossSec-derived speed) |
| `areaRatio` | 0.5 | 0.25–1.0 | Roll track height fraction. Track count is `hostHeight × ratio / lineHeight` (ceiling 64) roll danmaku take the **topmost enterable row** (a row becomes reusable once its predecessor has travelled 0.25 of the viewport, so each row holds ~3 lines and the used rows stay a contiguous 0..K-1 block — no vertical holes; box + gap + catch-up prediction, no overlap) while top/bottom stack from their own edge, so `1` really fills the overlay |
| `layoutWeights` | `{roll:80,top:10,bottom:10}` | 0–100 each (slider + number) | roll/top/bottom spawn weights |
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
| `presetsEnabled` | true | bool | Preset feature master switch; `false` stops ambient presets, event bursts and host fallbacks — only LLM danmaku remain. Pool replay is AI-only since 0.6.13, so preset rows are never replayed either way |
| `presetPack` | general | general/coding/casual | Preset selection |
| `blockedWords` | [] | string[] | Content filter (case-insensitive) |
| `density` | 3 | 1–10 | Spawn rate budget (1–2 → 3 lines/s, 3–5 → 6, 6–8 → 8, 9–10 → 10). **One line per tick**, and the interval never goes below what the band can absorb (`rows / row-reuse cycle`; a small display area slows down by itself), so lines never arrive in visible batches |
| `ambientMinMs` | 500 | 400–10000 | Min ambient spawn gap (ms) |
| `ambientMaxMs` | 1400 | ≥min+200, ≤20000 | Max ambient spawn gap (ms) |
| `contentMaxChars` | 200 | 8–2000 | **The real per-line hard cap**: pool writes, likes, rewrites and LLM output parsing all clip to it; same value as the settings card's Basics section and the floating quick panel |

### LLM

| Field | Default | Range / type | Effect |
|---|---|---|---|
| `llmEnabled` | true | bool | LLM generation master switch |
| `llmModel` | `-` | `-` or provider/model | LLM model id; `-` disables LLM generation |
| `llmBurstCount` | 5 | 1–20 | Comments per burst |
| `llmIntervalSec` | 18 | 5–120 | Interval-mode cadence |
| `stylePrompt` | 吐槽风格，短促有力 | string | Free-form LLM voice |
| `styleMaxChars` | 24 | 8–200 | "LLM max chars": written into the prompt to ask for short lines only — it **clips nothing** (the real hard cap is `contentMaxChars`) |
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
| `renderBackend` | auto | auto/dom/webgl2/webgl2-main/webgl2-worker | Renderer — all three backends are implemented; `webgl2-main` is an internal alias not shown in the dropdown. `auto` is the default: picks a working backend per client (desktop / browser) |

### Gift

Writes are clamped by `clampGiftConfig()` (`lib/gift-lib.js`), which returns exactly these 11 `gift*` keys and drops unknown ones (the `gift` namespace is closed). Per-field semantics: see [Gift effects](./gift-effects.md).

| Field | Default | Range / type | Effect |
|---|---|---|---|
| `giftEnabled` | false | bool | The gift module's **own** master switch, **off by default**; off means zero action for the gift module. The plugin master switch (`enabled`) also shuts it down entirely when off |
| `giftRoomId` | `''` | digits-only string, ≤20 chars (non-digits stripped) | Room id for catalog refresh, **filled in by the user**; empty issues no external request |
| `giftTemplate` | `{user} 送出了 {gift}` | string ≤100 (empty → default) | Tip danmaku template; placeholders `{user}` (sender), `{gift}` (gift name) |
| `giftSenders` | `[]` | array of `{name,weight}`, ≤50; `name` ≤24 chars, `weight` 0–100 | Weighted sender pool; empty/invalid entries dropped, anonymous fallback |
| `giftTrigger` | `{manual:true, random:false, probability:0.05, minMs:30000, maxMs:120000}` | `manual`/`random` bool; `probability` 0–1; `minMs` 1000–3600000; `maxMs` ≥minMs, ≤3600000 | Manual/random trigger and roll cadence |
| `giftMaxConcurrent` | 1 | 1–10 | On-screen effect concurrency cap; extras queue up |
| `giftShowSender` | true | bool | Whether the tip danmaku carries the sender nickname label |
| `giftLayout` | `{roll:100, top:0, bottom:0}` | each 0–100 | Roll/top/bottom layout weights for gift tip danmaku |
| `giftMaxAssetMB` | 8 | 1–64 | Per-asset size cap (MB); server 413s larger uploads |
| `giftScale` | 1 | 0.25–3 | Global size multiplier for gift effects; final size = viewport short side × 0.34 × this × asset size |

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

### Preset packs

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/danmaku/presets` | — | `{packs, order}` (the preset store as persisted) |
| PUT / POST | `/api/danmaku/presets` | `{packs:{...}, order?}` or `{store:{...}}`; `{action:'reset'}` restores the built-in packs | `{packs, order}`; reset returns the built-in defaults |
| POST | `/api/danmaku/presets/import` | `{name, data, existing?}` | `{ok:true, add:[string], detectedShape, stats:{parsed, droppedShort, overChars, failed, dupExisting, dupInFile}, name, existingCount}` |

`POST /api/danmaku/presets/import` backs the **pack editor's file import** (since 0.6.12): the browser reads the file into `data`, `name` is used only to dispatch on the extension (`.txt` / `.csv` / `.tsv` / `.json` / `.jsonl` / `.ndjson` / `.xml`), and `existing` is the pack's **current draft lines**, sent along so the host can dedupe (`trim → NFC → exact`, case-sensitive).

- The **cap is 16 MB (`PRESET_IMPORT_MAX_BYTES = 16 * 1024 * 1024`)**, enforced by `readCappedBody`. Note it covers **the file body plus `existing` combined** — the larger the draft you upload, the smaller the file that fits. Over the cap returns 413 with `limitText` reading 「16 MB（文件 + 现有条目合计）」.
- The route **returns an append plan and never writes to disk**: the client appends `add` to the draft, and the only writer is still `PUT /api/danmaku/presets` (the editor footer's Save).
- Error codes: `405 POST required`; `413 too_large` (with `limitBytes` / `limitText` / `bytes`); `400 aborted` (request interrupted); `400 bad-json`; `400 bad-body` (body is not a `{name, data, existing}` object); `400 empty-data` (`data` empty); `400 bad-existing` (`existing` not an array); `400 no-entries` or the parser's own reason (with `detectedShape` and `stats` — **valid JSON that yields zero entries is never a 200**); `400 import-failed` as the catch-all.

```bash
# Wrap the file body into `data` (jq does the escaping; -d @- reads stdin)
jq -Rs '{name:"danmaku.json", data:., existing:[]}' danmaku.json \
  | curl -X POST http://127.0.0.1:3080/api/danmaku/presets/import \
      -H 'Content-Type: application/json' --data-binary @-
```

### Session pools

| Method | Path | Query / body | Returns |
|---|---|---|---|
| GET | `/api/danmaku/pools` | — | `{sessions:[{sessionId, title, live, archived, oldest, newest}]}` (`title` is the folded session title — see below) |
| GET | `/api/danmaku/pool` | `sessionId=`, `scope=live\|archive\|all` or `stats=1` | `stats=1` → pool stats; `scope` → `{items, sessionId, scope}`; else history-replay scored items |
| PATCH | `/api/danmaku/pool/item` | `{sessionId, id, content?, weight?, tags?}` | `{ok, scope:'live'\|'archive'}` |
| DELETE | `/api/danmaku/pool/item` | `{sessionId, id, scope?}` | `{ok, scope}` |
| POST | `/api/danmaku/pool/restore` | `{sessionId, id}` | `{ok, item}` or `{ok:false, reason:'too_old'\|'not_found'}` (403 on too_old) |
| POST | `/api/danmaku/pools/clear` | — | `{ok, removed}` (deletes all session live+archive pool files) |
| DELETE | `/api/danmaku/pool/session` | `{sessionId}` | `{ok, removed}` (deletes ONLY that session's live+archive pool files; other sessions untouched) |
| POST | `/api/danmaku/like` | `{sessionId?, content, source:'ai'\|'preset'\|'user'}` | `{ok, liked}` (only `source:'ai'` bumps likes+weight or appends; other sources are no-ops) |

> 0.6.13: only `source: 'ai'` entries are cached and replayed. `preset-sample` never writes the pool; liking a preset/user item returns `{ok:true, liked:false}` without touching the file.

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
