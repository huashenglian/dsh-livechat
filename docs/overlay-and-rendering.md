# Overlay & Rendering

[English](./overlay-and-rendering.md) | [中文](./overlay-and-rendering.zh-CN.md)


How the danmaku layer mounts onto the page, renders comments, avoids collisions, stays out of your way, and where it can go next with GPU backends.

## Mount point

The plugin mounts into the **`shell.overlay`** slot — a host-provided absolutely-positioned, `pointer-events:none` layer (`inset:0; z-index:20`) that sits above the conversation content.

The client observes the **center conversation column** via `ResizeObserver` + `getBoundingClientRect` (preferring a `[data-shell-overlay]` sibling layout / center column), and clips the danmaku layer to that column so floating comments never spill over the sidebars. Fallback: fill the whole viewport with `pointer-events:none`, letting only individual danmaku bars capture `auto` pointer events — sidebar clicks stay unblocked.

## Layout types

Every danmaku item is one of three layouts, chosen per-spawn by a weighted pick:

| Layout | Behavior | Config weights |
|---|---|---|
| **roll** | Scrolls left across the area, multi-track | `layoutWeights.roll` (default 80) |
| **top** | Fixed at top edge, full-height, timed exit | `layoutWeights.top` (default 10) |
| **bottom** | Fixed at bottom edge, timed exit | `layoutWeights.bottom` (default 10) |

> [!TIP]
> `areaRatio` (0.25–1.0) constrains only the **roll** track height. Top/bottom danmaku always paste to the full-height edges, matching Bilibili behavior.

## Track collision avoidance

Roll danmaku share up to `MAX_TRACKS` (16) horizontal lanes. Before spawning into a track, the renderer checks the last item that entered it: has it moved far enough left to leave room for the new item plus a gap? The check lives in `canEnterTrack()` (`lib/presets.js`) and uses a Bilibili-style gap-time formula:

```
gapSec ≈ (lastWidth + nextWidth + gapPx) / lastVelocity
```

If no track has room, the item is dropped (or retried next tick) — this is why dense moments simply show fewer comments rather than overlapping. Top/bottom layouts stack with their own spacing and a max-on-screen cap.

## Anti-occlusion

Reading the conversation shouldn't fight a wall of text. Two knobs cooperate:

- **`opacity`** (0.1–1.0): full brightness while the overlay is "active" (recent triggers / hovering).
- **`opacityIdle`** (0–0.8): dimmed brightness when idle. With `antiOcclude: true` (default), the overlay fades to `opacityIdle` after activity settles and brightens back on new triggers or hover. This keeps danmaku present-but-quiet while you read.

## Performance posture (DOM backend)

The **DOM backend** is the visual and behavioral baseline. It uses:

- `transform: translate3d(...)` for GPU-composited motion (no layout thrash)
- On-screen cap enforced by `maxOnscreen` (default 40); excess items are recycled
- Page `visibilitychange` → `hidden` pauses all animation (no offscreen CPU burn)
- Node count bounded — no unbounded DOM growth across a long session

This targets **Chromium** (Edge / Chrome). Other engines render but aren't tuned.

The two GPU backends reuse the same business logic (spawn, collision, pause, config) and only swap the drawing layer, so the DOM backend remains the reference for look and feel.

## Render backend chain

`renderBackend` accepts `auto | dom | webgl2 | webgl2-main | webgl2-worker`. **All three backends are implemented** — DOM, main-thread WebGL2, and Worker-driven WebGL2 (OffscreenCanvas).

| Backend | Status | What it is |
|---|---|---|
| `dom` | implement | `translate3d` DOM nodes; native hover-pause and click |
| `webgl2` | implement | Main-thread WebGL2 instanced quads (L2) |
| `webgl2-worker` | implement | Offscreen canvas + Worker-driven instanced render (L1) |

The `auto` chain degrades on failure: **Worker → main-thread → DOM**. If Worker init throws it tries main-thread WebGL2, and if that throws too it falls back to DOM.

`webgl2-main` is an **internal config alias**. It is accepted and handled (parsed as valid config, routed to the main-thread WebGL2 renderer, and used by the `auto` chain as the middle fallback), but it is **not shown in the settings dropdown** — the UI lists `auto / dom / webgl2 / webgl2-worker` only. Use it in a config file or HTTP patch when you want to pin the main-thread renderer explicitly.

### Known GPU capability gaps (documented limitations)

The GPU backends are not yet at visual parity with DOM for everything. These are documented limitations, not work in progress:

| Capability | On GPU backends (`webgl2`, `webgl2-worker`) |
|---|---|
| **advanced** styles (rain / pop / rotate / scale / bold) | DOM-only. The GPU backends discard advanced styling entirely. |
| **emoji** images | DOM-only. GPU backends only strip emoji characters from text (`filterEmoji`); they never draw the emoji image. |
| `reverse` layout | Remapped to `roll` on both GPU backends. There is no reverse track in the GPU renderers; items flagged `reverse` scroll as normal roll danmaku. |

Everything else (roll / top / bottom layouts, color weighting, stroke, on-screen caps, pause semantics) behaves the same across backends.

The upgrade path follows `参考文档/danmaku-renderer-design.md` (§11 degradation chain) — business logic stays untouched; only the renderer implementation swaps.

## Related config

| Field | Default | Range | Effect |
|---|---|---|---|
| `opacity` | 0.85 | 0.1–1.0 | Active brightness |
| `opacityIdle` | 0.15 | 0–0.8 | Idle (reading) brightness |
| `antiOcclude` | true | bool | Fade to idle when quiet |
| `maxOnscreen` | 40 | 1–200 | Hard cap on live DOM nodes |
| `fontSize` | 16 | 12–36 | px |
| `crossSec` | 8 | 3–20 | Seconds for roll item to cross |
| `scrollSpeed` | 140 | 40–400 | px/s (overrides crossSec-derived speed) |
| `areaRatio` | 0.5 | 0.25–1.0 | Roll track height fraction |
| `layoutWeights` | 80/10/10 | 0–100 each | roll/top/bottom spawn weights |
| `stroke` | true | bool | White text stroke for readability |
| `renderBackend` | dom | auto/dom/webgl2/webgl2-main/webgl2-worker | Renderer selection (`webgl2-main` is an internal alias, not in the dropdown) |

See [configuration.md](configuration.md) for the full field reference.
