# Gift effects

[English](./gift-effects.md) | [中文](./gift-effects.zh-CN.md)


Gift effects: plays a gift animation over the chat area and floats a gift-tip danmaku. The master switch is off by default; nothing happens until you add and bind assets.

## Overview

The gift module has three layers:

- **Asset library** — a local library (SVG / SVGA / images) with folders, weights and a manifest, stored under `$DSH_HOME/danmaku-gifts/`.
- **Gift catalog** — the Bilibili gift list (name / id / price / icon) used by the left column; a built-in offline catalog ships with the plugin, and you can extract-merge it with your own room id.
- **Effect position** — map a *gift* to an asset card and pick its landing position; on trigger the animation plays plus one tip danmaku.

Gift effects share the danmaku overlay: effects render on their own `.dsh-gift-layer` that never intercepts pointer events; tip danmaku travel the regular tracks.

A fresh install seeds **3 default gift cards** on first boot (imported offline from the bundled catalog):

| Gift | ID | Card weight (= trigger-probability factor) |
|---|---|---|
| 牛哇牛哇 | 31225 | 0.7 |
| 人气票 | 34391 | 1 |
| 干杯 | 31116 | 0.2 |

## Entry points

Settings → Plugins → Plugin config → **"Live Chat Danmaku"** card, scroll to the **Gifts** section:

- **Enable gift effects** (`giftEnabled`) — the master switch, **off by default**.
- **Open gift config…** — the single entry button, opening the large modal (gift list on the left + four modules on the right).

There is also a **Gifts** settings tab in the left nav (right after **Danmaku pools**). The large modal is `min(960px, 94vw)` × `min(680px, 86vh)`: the top row is a full-width **room id [input][Extract]**; the left column is the gift list; the right side is a **single scroll pane with four stacked sections** — asset library / effect position / basics / test — plus a thin anchor strip on the right (Assets / Position / Basics / Test), no menu ping-pong.

## Asset library

The right-pane **Asset library** section is where the left column's "+" lands, and the main local-store UI:

- **Bordered scroll container** — assets render as grid cards (folders + cards) inside a bordered, scrollable container; content past the height scrolls inside.
- **Looping thumbnails** — SVG and animated-image (gif/apng/webp) thumbs remount once per shared tick (3 s) so their one-shot CSS animation replays instead of freezing blank; png/jpg stay static, SVGA keeps a type badge + hover preview.
- **Total-probability formula** — shown directly below the material container: `P(gift i)=total prob ×(weight_i/Σweight)`; effective only when *Random ambient* is on.
- **Card weight = trigger probability** — each card's **weight** (0–100) is its probability factor in the weighted draw; weight 0 never triggers.
- **Full-width import dialogs** — the four import paths (files / paste SVG / GitHub / zip) expand into full-row dialogs that never squeeze the layout.

Supported extensions: `.svg`, `.svga`, `.gif`, `.apng`, `.webp`, `.png`, `.jpg`. Per-file size cap `giftMaxAssetMB` (default 8 MB, adjustable 1–64). Imports are **job-based**: the upload endpoint returns a job object and the UI polls `/api/danmaku/gift/assets/import/status` for progress. Asset files live in `$DSH_HOME/danmaku-gifts/files/` with a `manifest.json` alongside; delivery goes through `GET /api/danmaku/gift/file?id=` (Range / ETag / immutable caching).

> [!NOTE]
> Gift assets are **user property**: uninstalling the plugin never deletes them; the **Clear assets** button asks for confirmation.

A left-column row's **added** state is derived **solely from the asset store**: when an asset card with `source === 'gift:<id>'` exists the row shows **"Added"**, otherwise **"+"**. Clicking "+" makes the host extract the gift animation through its whitelisted fetch (`importGift`) into a card — on success the row becomes "Added"; deleting that card makes the row **fall back to "+"**. A gift with no card **never triggers** — the draw only ever picks among **bound gifts that have a card with a positive weight**.

## Gift catalog & room-id extraction

The catalog is read from `$DSH_HOME/danmaku-gifts/catalog.json`; when missing, the bundled `assets/gift-catalog.json` seeds it (fully offline).

To **extract-merge your own** room's gift list into the catalog:

1. Fill the **room id** box at the modal top — **the room id is filled in by you**; the repo and its docs always use a placeholder, e.g. `<your room ID>`.
2. Hit **Extract**. An empty input only shows a hint and issues **no request at all**.

Behavior contract:

- Extraction is a **merge-dedupe**: the live gift config is mapped and **merged into the current catalog** (existing entries kept, missing ones added) — never a wholesale replacement; the response returns `{added, skipped}` and a second click on the same room id reports `added` 0.
- Success → toast "Added X / skipped Y" and refetch the left column; failure → toast only, **no file written**, no room-id echo.
- Mapping reads only whitelisted fields, so room identifiers from the raw response (`room_id`, `uid`, …) **never** enter the catalog or the logs (logs print count summaries only).

## Effect position

With a gift selected in the left column, the right-pane **Effect position** section shows it and keeps the same interaction:

- **Position** — 8 options: `center` / `top` / `bottom` / `top-left` / `top-right` / `bottom-left` / `bottom-right` / `random` (7 presets + random).
- **Position preview bar** — a mini frame showing the normalized anchor, updating live with the dropdown.

The position is written to the `position` field of `giftBindings` (keyed by gift id) with a **delta** POST, **preserving** that binding's `assetId` / `scale` / `durationMs` / `loop` (these fields still exist in the schema and keep their defaults — scale 0.25–2, duration 1–10 s — they are simply no longer edited in the UI). Binding shape: `{assetId, position, scale, durationMs, loop}`.

## Basics & test

The right-pane **Basics** and **Test** sections (shows "enable the gift module first" and disables the test button while the master switch is off):

- **Random ambient** (`giftTrigger.random`) — off by default; when on it rolls `probability` (0–1, i.e. total probability) with a `minMs`/`maxMs` interval (1 s – 1 h).
- **Tip template** (`giftTemplate`) — placeholders `{user}` (sender) and `{gift}` (gift name), max 100 chars, with a live substitution preview as you type.
- **Sender pool** (`giftSenders`) — a weighted `{name, weight}` list, up to 50 entries, 24-char names, weights 0–100; falls back to anonymous when empty.
- **Test now** — triggers one random gift immediately and shows the last trigger status (gift / sender / error); when there is no material to trigger it says "No gift material available (click "+" on the left first)".

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
