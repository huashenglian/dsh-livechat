# Gift effects

[English](./gift-effects.md) | [中文](./gift-effects.zh-CN.md)


Gift effects: plays a gift animation over the chat area and floats a gift-tip danmaku. The master switch is off by default; nothing happens until you add and bind assets.

## Overview

The gift module has three layers:

- **Asset library** — a local library (SVG / SVGA / images) with folders, weights and a manifest, stored under `$DSH_HOME/danmaku-gifts/`.
- **Gift catalog** — the Bilibili gift list (name / id / price / icon) used by the left column; a built-in offline catalog ships with the plugin, and you can extract-merge it with your own room id.
- **Effect position** — map a *gift* to an asset card and pick its landing position; on trigger the animation plays plus one tip danmaku.

Gift effects share the danmaku overlay: effects render on their own `.dsh-gift-layer` that never intercepts pointer events; tip danmaku travel the regular tracks.

A fresh install seeds **3 default gift cards** on first boot (the gift catalog is bundled and works offline, but importing each card's animation file needs the network; offline the seed is skipped — 0 cards, retryable manually later):

| Gift | ID | Card weight (= trigger-probability factor) |
|---|---|---|
| 牛哇牛哇 | 31225 | 0.7 |
| 人气票 | 34391 | 1 |
| 干杯 | 31116 | 0.2 |

## Entry points

Settings → Plugins → Plugin config → **"Live Chat Danmaku"** card, scroll to the **Gifts** section:

- **Enable gift effects** (`giftEnabled`) — the master switch, **off by default**.
- **Open gift config…** — the single entry button, opening the large modal (gift library + asset library + config).

There is also a **Gifts** settings tab in the left nav (right after **Danmaku pools**). The large modal is `min(1280px, 96vw)` × `min(760px, 88vh)`, split into three panes:

- **Left (gift library)**: the Bilibili gift list, each row a "+" or a red "×" (starts at 248px, 200–400).
- **Center (asset library)**: the local asset panel, one toolbar row on top and a width-adaptive asset grid below.
- **Right (config)**: effect position / basics / test sections (starts at 300px, 240–420).

The two pane dividers are **draggable**; widths are written to local storage (key `dsh-gift-pane-layout-v1`) and **survive page reload, reopening the modal, and restarting dsh**. There is no right-side anchor strip anymore, and no single-page four-section layout.

## Asset library

The center pane is the main local-store UI, with a single toolbar row on top and the asset grid below:

- **Toolbar**: room-id input (**no label**, placeholder only) + "Extract" | "Import file…" + "▾" | "Icon size" | "New folder" | "Clear assets".
- **Import file…**: pick files to import (through a file input).
- **▾ menu**: three items, Paste SVG code / Import from GitHub… / Import zip…. **Paste SVG code** and **Import from GitHub…** open a **centered text-input modal** (confirm imports): SVG is a multi-line textarea; GitHub is a repo URL plus an import cap (0 = unlimited).
- **Icon size**: opens a popover below the button (slider + number input, 0.6–1.6, default 1) that live-scales the **folder and asset cards** in the grid (column width and card height follow the multiplier); click outside to dismiss; the multiplier persists in local storage (key `dsh-gift-icon-scale-v1`) across reloads/restarts.
- **Adaptive card density**: assets spread as a grid; how many fit per row follows the center pane's width (fewer when narrow, more when wide), each card filling its cell.
- **Looping thumbnails**: SVG thumbs remount once per shared tick (3 s) so their one-shot CSS animation replays instead of freezing blank; animated-image (gif/apng/webp) formats loop natively and stay a plain stable `<img>` (no periodic re-decode), png/jpg stay static, SVGA keeps a type badge + hover preview.
- **Card weight = trigger probability**: each card's **weight** (0–100) is its probability factor in the weighted draw; weight 0 never triggers.

Supported extensions: `.svg`, `.svga`, `.gif`, `.apng`, `.webp`, `.png`, `.jpg`. Per-file size cap `giftMaxAssetMB` (default 8 MB, adjustable 1–64). Imports are **job-based**: the upload endpoint returns a job object and the UI polls `/api/danmaku/gift/assets/import/status` for progress. Asset files live in `$DSH_HOME/danmaku-gifts/files/` with a `manifest.json` alongside; delivery goes through `GET /api/danmaku/gift/file?id=` (Range / ETag / immutable caching).

> [!NOTE]
> Gift assets are **user property**: uninstalling the plugin never deletes them; the **Clear assets** button asks for confirmation.

A left-column row's state is derived **solely from the asset library**: when an asset card with `source === 'gift:<id>'` exists the row shows a **red "×"**, otherwise **"+"**. Clicking "+" makes the host extract the gift animation through its whitelisted fetch (`importGift`) into a card; on success the row becomes "×". Clicking "×" deletes that card and the row **falls back to "+"** (no confirmation). A gift with no card **never triggers**; the draw only ever picks among **bound gifts that have a card with a positive weight**.

## Gift catalog & room-id extraction

The catalog is read from `$DSH_HOME/danmaku-gifts/catalog.json`; when missing, the bundled `assets/gift-catalog.json` seeds it (fully offline).

To **extract-merge your own** room's gift list into the catalog:

1. Fill the **room id** box in the center toolbar: **the room id is filled in by you**; the repo and its docs always use a placeholder, e.g. `<your room ID>`.
2. Hit **Extract**. An empty input only shows a hint and issues **no request at all**.

Behavior contract:

- Extraction is a **merge-dedupe**: the live gift config is mapped and **merged into the current catalog** (existing entries kept, missing ones added) — never a wholesale replacement; the response returns `{added, skipped}` and a second click on the same room id reports `added` 0.
- Success → toast "Added X / skipped Y" and refetch the left column; failure → toast only, **no file written**, no room-id echo.
- Mapping reads only whitelisted fields, so room identifiers from the raw response (`room_id`, `uid`, …) **never** enter the catalog or the logs (logs print count summaries only).

## Effect position

Clicking a **material card in the center pane** shows it in the right-pane **Effect position** section:

- If the card comes from a gift (`source === 'gift:<id>'`) and a matching binding exists, it shows the gift name and ID with the same interaction as before:
  - **Position**: 8 options, `center` / `top` / `bottom` / `top-left` / `top-right` / `bottom-left` / `bottom-right` / `random` (7 presets + random).
  - **Position preview bar**: a mini frame showing the normalized anchor, updating live with the dropdown.
- If the card is not bound to a gift (built-in or plain import), or the binding dangles (its asset card no longer exists), it shows a "not bound to a gift, position does not apply" hint and no position control.

Clicking a left-column gift row **no longer** opens the position panel (rows only carry "+"/"×"). The position is written to the `position` field of `giftBindings` (keyed by gift id) with a **delta** POST, **preserving** that binding's `assetId` / `scale` / `durationMs` / `loop` (these fields still exist in the schema and keep their defaults, duration 1–10 s, they are simply no longer edited in the UI). Binding shape: `{assetId, position, scale, durationMs, loop}`.

## Basics & test

The right-pane **Basics** and **Test** sections (shows "enable the gift module first" and disables the test button while the master switch is off), with each control on its own row:

- **Total probability** (`probability`, 0–1): once the master switch is on, gifts roll at this probability with the min/max interval below. **Turning the master switch on is the random trigger**; there is no separate "random ambient" switch.
- **Global size** (`giftScale`, 0.25–3, default 1): one multiplier for every gift effect; multiplied with the asset-local scale and the binding scale to produce the final effect size (base = viewport short side × 0.34).
- **Asset size** (the asset's `scale`, 0.25–3, default 1): editable only after an asset card is selected (the slider stays disabled otherwise); affects only that asset's playback size and is stored in the asset manifest.
- **Min interval / max interval**: one row each, each with a draggable slider and a **number input** on the right (in seconds, 1–3600).
- **Tip template** (`giftTemplate`): placeholders `{user}` (sender) and `{gift}` (gift name), max 100 chars, with a live substitution preview as you type.
- **Sender pool** (`giftSenders`): a weighted `{name, weight}` list, up to 50 entries, 24-char names, weights 0–100; falls back to anonymous when empty.
- **Test now**: triggers one random gift immediately and shows the last trigger status (gift / sender / error); when there is no material to trigger it says "no gift material available (click "+" on the left first)".

> [!NOTE]
> The **Manual trigger** checkbox was removed from the UI; the `giftTrigger.manual` **field still exists** in the schema and defaults (on by default) — it simply has no control anymore.

On trigger: the bound asset's effect plays and one tip danmaku is layered in per `giftTemplate` (`giftShowSender` toggles the nickname label); concurrency caps at `giftMaxConcurrent` (default 2, 1–10) with FIFO queueing and drops past the queue limit. Random rolls participate **only when the master switch is on and a session is active** — blank / no-session pages never trigger.

## Privacy

- **The room id stays local**: `giftRoomId` only shapes the `giftConfig(pc)` request; the repo (code/scripts/CI/docs/tests/screenshots) **never contains a real room id** — docs always use placeholders.
- Catalog mapping reads only whitelisted fields, so room identifiers in the raw response cannot leak; logs print count summaries only, never a room id.
- An empty room id issues no external request (see *Gift catalog & room-id extraction*).
- `tools/check-gift-privacy.mjs` is the hard gate: by default it runs the secret-free agent-side assertions; the final gate is user-run as `PRIVATE_ROOM_ID=<number> node tools/check-gift-privacy.mjs` with the real number supplied via env, requiring **zero hits** across the publish whitelist.

## Limits

- **No audio** — effects are visual only, no sound is played.
- **No combo** — `combo_id` exists as a catalog field only; there is no combo UI or combo behavior.
- **No mobile** — built for the desktop web overlay (Chromium first), no mobile layout.
- SVGA relies on the bundled player; assets are rendered visually only and never mixed into audio.
