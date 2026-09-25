# Gift effects

[English](./gift-effects.md) | [中文](./gift-effects.zh-CN.md)


Viewer-gift simulation: plays a gift animation over the chat area and floats a gift-tip danmaku. The master switch is off by default; nothing happens until you bind assets.

## Overview

The gift module has three layers:

- **Asset store** — a local library (SVG / SVGA / images) with folders, weights and a manifest, stored under `$DSH_HOME/danmaku-gifts/`.
- **Gift catalog** — the Bilibili gift list (name / id / price / icon) used by the left column; a built-in offline catalog ships with the plugin, and you can refresh it with your own room id.
- **Binding & effects** — map a *gift* to an *asset*, pick landing position, scale, duration and loop; on trigger the animation plays plus one tip danmaku.

Gift effects share the danmaku overlay: effects render on their own `.dsh-gift-layer` that never intercepts pointer events; tip danmaku travel the regular tracks.

## Entry points

Settings → Plugins → Plugin config → **"Live Chat Danmaku"** card, scroll to the **Gifts** section:

- **Enable gift effects** (`giftEnabled`) — the master switch, **off by default**.
- **Open gift config…** — opens the large modal focused on the binding section.
- **Asset store…** — opens the large modal focused on the assets section.

There is also a **Gifts** settings tab in the left nav (right after **Danmaku pools**). The large modal is `min(960px, 94vw)` × `min(680px, 86vh)`: the left column is the catalog list (search by name/id, filter by `coin_type`/`type`, first 100 rows + **Load more**, icon 404 placeholder, **Unbound** badge); the right side is a **single scroll pane with three stacked sections** — asset store / binding & effect params / gift simulation — plus a thin anchor strip on the right, no menu ping-pong.

## Asset format & import

Supported extensions: `.svg`, `.svga`, `.gif`, `.apng`, `.webp`, `.png`, `.jpg`. Per-file size cap `giftMaxAssetMB` (default 8 MB, adjustable 1–64).

The asset-store toolbar offers four import paths:

| Path | What it does |
|---|---|
| Pick files | multi-select local files, imported one by one |
| Paste SVG source | paste raw SVG markup; the **host sanitizes it first** (`sanitizeSvg`), dropping non-whitelisted containers/scripts |
| Import from GitHub… | paste a git repo URL (`https` / `git@` / `file://`), the repo is cloned and its assets imported |
| Upload zip | upload an archive; every entry name is **validated before extraction** (path traversal rejected) and the import runs as a job with progress/abort |

Imports are **job-based**: the upload endpoint returns a job object and the UI polls `/api/danmaku/gift/assets/import/status` for progress. Asset files live in `$DSH_HOME/danmaku-gifts/files/` with a `manifest.json` alongside; delivery goes through `GET /api/danmaku/gift/file?id=` (Range / ETag / immutable caching).

> [!NOTE]
> Gift assets are **user property**: uninstalling the plugin never deletes them; the **Clear assets** button asks for confirmation.

## Catalog & refresh

The catalog is read from `$DSH_HOME/danmaku-gifts/catalog.json`; when missing, the bundled `assets/gift-catalog.json` seeds it (fully offline).

To refresh the catalog to **your own** room's gift list:

1. Set `giftRoomId` in the config — **the room id is filled in by you**; the repo and its docs always use a placeholder, e.g. `<your room ID>`.
2. Hit **Refresh catalog**, equivalent to `POST /api/danmaku/gift/catalog` `{"action":"refresh"}`.

Behavior contract:

- **Empty room id → no external request at all**: the built-in catalog is returned (`reason: "no-room"`) and nothing is written.
- Refresh OK → the live gift config is mapped into a catalog and written atomically to `catalog.json`.
- Refresh fails → silent fallback to the built-in catalog (`reason: "fetch-failed"`), no error popup, no interruption.
- Mapping reads only whitelisted fields, so room identifiers from the raw response (`room_id`, `uid`, …) **never** enter the catalog.

## Binding & effect params

With a gift selected in the left column, the **Binding & effect params** section on the right offers:

- **Bind asset** — pick an asset from the thumbnail-grid mini popup; an empty state guides you when unbound.
- **Position** — 8 options: `center` / `top` / `bottom` / `top-left` / `top-right` / `bottom-left` / `bottom-right` / `random` (7 presets + random).
- **Scale** — 0.25–2×; actual size = `min(viewport width, viewport height) × 0.5 × scale`, clamped to 0.25–2.
- **Duration** — 1–10 seconds.
- **Loop** — when checked the effect keeps replaying past the duration until replaced/cleared.
- **Position preview bar** — a mini frame showing the normalized anchor, updating live with the dropdown.
- **Unbind** / **Reset bindings** — unbind one gift, or clear all `giftBindings` at once.

Bindings are stored in `giftBindings` keyed by gift id: `{assetId, position, scale, durationMs, loop}`.

## Simulation

The **Gift simulation** section on the right (shows "enable the gift module first" and disables itself while the master switch is off):

- **Manual trigger** (`giftTrigger.manual`) — on by default.
- **Random ambient** (`giftTrigger.random`) — off by default; when on it rolls `probability` (0–1) with a `minMs`/`maxMs` interval (1 s – 1 h).
- **Tip template** (`giftTemplate`) — placeholders `{user}` (sender) and `{gift}` (gift name), max 100 chars, with a live substitution preview as you type.
- **Sender pool** (`giftSenders`) — a weighted `{name, weight}` list, up to 50 entries, 24-char names, weights 0–100; falls back to anonymous when empty.
- **Test now** — triggers one random gift immediately and shows the last trigger status (gift / sender / error).

On trigger: the bound asset's effect plays and one tip danmaku is layered in per `giftTemplate` (`giftShowSender` toggles the nickname label); concurrency caps at `giftMaxConcurrent` (default 2, 1–10) with FIFO queueing and drops past the queue limit. Random rolls participate **only when the master switch is on and a session is active** — blank / no-session pages never trigger.

## Privacy

- **The room id stays local**: `giftRoomId` only shapes the `giftConfig(pc)` request; the repo (code/scripts/CI/docs/tests/screenshots) **never contains a real room id** — docs always use placeholders.
- Catalog mapping reads only whitelisted fields, so room identifiers in the raw response cannot leak; logs print count summaries only, never a room id.
- An empty room id issues no external request (see *Catalog & refresh*).
- `tools/check-gift-privacy.mjs` is the hard gate: by default it runs the secret-free agent-side assertions; the final gate is user-run as `PRIVATE_ROOM_ID=<number> node tools/check-gift-privacy.mjs` with the real number supplied via env, requiring **zero hits** across the publish whitelist.

## Limits

- **No audio** — effects are visual only, no sound is played.
- **No combo** — `combo_id` exists as a catalog field only; there is no combo UI or combo behavior.
- **No mobile** — built for the desktop web overlay (Chromium first), no mobile layout.
- SVGA relies on the bundled player; assets are rendered visually only and never mixed into audio.
