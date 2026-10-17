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

Turn the whole feature off with `presetsEnabled: false` (default `true`). With presets off: ambient presets, event bursts and the host's LLM fallback all stop, **and** preset danmaku already recorded in a session pool are not replayed — only LLM danmaku remain. The switch is live (no reload) and persists like any other setting.

### Preset pack editor (since 0.6.10)

**Edit…** in the settings card's content section opens the pack editor: add/remove packs, rename them, edit the danmaku lines.

- **One save, one place.** The editor has **no Save button of its own** — it only mutates the *Danmaku Live Chat* card's draft. Only that window's bottom-right **Save** runs `PUT /api/danmaku/presets`. Closing the editor keeps your draft.
- **One way back.** The card's footer **Undo**, or simply **closing the *Danmaku Live Chat* window** (the draft is dropped, nothing reaches disk). The editor offers no undo of its own.
- **Deleting a pack is staged, not applied.** The red trash button opens a confirmation (red title + pack name); confirming drops the pack **from the draft** (the content section's pack dropdown loses it too) while the **server and disk stay untouched**. The deletion only becomes real when you press the card's **Save**. If `presetPack` pointed at the removed pack it is re-pointed at the first survivor, so no dangling reference is stored.
- A saved deletion also stops being sampled **this session**: `applyPresetStore()` now rebuilds the runtime pack table instead of merging into it (it used to only add), so a deleted pack is gone immediately rather than after a restart.

### Import & list view (since 0.6.12)

The pack editor's title row is now three sections: **Import** &#124; **Text / List** toggle, level with the title.

**Two views**

- The default view follows the row count: **more than 500 rows opens in the list view**, otherwise the text view (re-derived on every pack switch; a pack that crosses 500 rows because of an import switches to the list immediately). A 22k-line pack never degrades into one ~1MB textarea.
- Text mode normalizes every line first and only then joins with newlines, so a line containing a newline never splits into two. Writing back splits on newlines, normalizes each line and drops empty strings only (single-character danmaku like 「6」 survive).
- Both views are controlled and write through to the draft on every keystroke. Switching views only clears the selection and resets the page — the round trip is lossless.

**List view**

| Element | Behaviour |
|---|---|
| Search bar | Case-insensitive **substring** match. The **full set is filtered first, then paginated**, so search spans every page and the hit count and page count are those of the filtered result |
| `Select all filtered (N)` | Selects the filtered result across **all pages** — not the whole pack |
| `Delete selected (N)` | Deletes by underlying row index |
| Row: `[checkbox][input][×]` | Checkbox for bulk actions; the input writes through on change; `×` deletes that row |
| `＋ Add entry` | Appends one empty row at the end |
| Pager + `Per page` | Page size lives in localStorage as `dsh-danmaku-preset-page-size`, **default 50, clamped 10..500** (a UI preference, not a config field, so it is per browser) |

Two semantics worth knowing:

- **Emptying a row never deletes it** (D15). The empty row stays, its input border turns red, and only `×` or Delete selected actually removes it. Auto-deleting would shift every later selected index, so a bulk delete would hit the wrong rows.
- **Select-all means the current filtered result** (D16). The button shows the hit count, so what you are selecting is never a guess.

**File import**

`.txt` / `.csv` / `.tsv` / `.json` / `.jsonl` / `.ndjson` / `.xml` (bilibili `<d>` danmaku) are supported, dispatched on the **lower-cased extension** (with any `?query` / `#hash` stripped):

| Extension | Parsing |
|---|---|
| `.json` | `JSON.parse`. Array elements that are strings are used directly; objects are read by priority `barrage → text → content → line → msg → message`. A string root and a single object are accepted too |
| `.jsonl` / `.ndjson` | `JSON.parse` per line, same field priority; unparsable lines only count toward `failed` |
| `.csv` / `.tsv` | RFC 4180, taking the **first field of each record** (quoted fields, `""` escaping, CRLF and newlines inside quotes are all supported; an unclosed quote runs to the end of the text) |
| `.xml` | Extracts the text of `<d …>text</d>` and applies minimal entity unescaping (`&lt;` `&gt;` `&quot;` `&#39;` `&#x27;` `&nbsp;` `&amp;`) |
| anything else (including `.txt` and no extension) | Split on newlines |

The heavy lifting happens on the host: `POST /api/danmaku/presets/import` (see [configuration.md](configuration.md)). The browser only reads the file into text.

- **Dedupe rule**: `trim → NFC normalize → exact comparison` (**case-sensitive**). Compared against both the pack's current entries and the entries collected in this batch; `add` keeps the file's original order.
- **Append, never overwrite.** New entries land at the end of the pack's `lines`; existing entries are untouched.
- **Normalization**: BOM and C0/C1 controls are stripped (emoji survive), **newlines and tabs inside an entry are folded to a single space**, then trimmed. The only drop condition is "empty after normalization"; entries over 48 characters are **not dropped and not truncated**, they only count toward the `overChars` hint (the 48-character cap applies to the LLM path only).
- **Result, three counts**: added = `add.length`; existing = `dupExisting + dupInFile`; skipped = `droppedShort + failed`.
- **Draft only.** An import does not write to disk either — the footer Save still is.

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

**Long thinking & warnings**

- Reasoning-only streams (`reasoning-delta`) map to soft `thinking` activity; `thinkingAsActive` (default true) keeps interval from backing off. The generate prompt embeds a thinking excerpt capped by `thinkingExcerptChars` (default 240).
- Truncation (`max-tokens`) and notice warnings map to `warning`; `warningAlwaysWake` (default on) always wakes generation; overlay can flash SC.
- **Token/API stats**: usage (input/output/cache hit) is pulled from session events into the prompt when `contextSources.usage` is on.

**Readable context (`contextSources`)**

| Key | Default | Meaning |
|---|---|---|
| `conversation` | true | Recent dialogue summary |
| `thinking` | true | Thinking excerpt |
| `warning` | true | Warning/truncation text |
| `usage` | true | Token/API stats |
| `tools` | true | Recent tool names |
| `events` | true | Event kind list |

Disable a key to omit it from the LLM prompt.

**Silence backoff (`backoff*`)**

Interval heartbeat grows from `backoffBaseSec` by `backoffFactor` up to `backoffMaxSec` while quiet; activity ≥ `backoffResetSec` resets. Set `backoffEnabled: false` to disable.

Settings groups **Wake advanced** and **Readable context** are collapsible (collapsed by default).

### The safe fallback

LLM calls can fail (no provider, timeout, parse error, network). When they do, the host **silently** falls back to a preset burst tagged `source: 'preset'` with `reason: 'llm-fallback'`. No error popups, no broken overlay — the crowd keeps talking. (With `presetsEnabled: false` there is no preset to fall back to: the host answers `items: []` / `reason: 'presets-disabled'` and the pool is left untouched.)

> [!NOTE]
> The LLM prompt forbids leaking secrets/paths or spoiling future steps. Output is also capped at `styleMaxChars` (default 24) and filtered by `blockedWords`.

## Blocked words

`blockedWords` (string array) is checked case-insensitively against both preset and LLM output. Any hit is dropped before it reaches the screen.

## Related config

| Field | Default | Range | Effect |
|---|---|---|---|
| `presetsEnabled` | true | bool | Preset feature master switch; `false` = LLM only (no generation, no replay) |
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
