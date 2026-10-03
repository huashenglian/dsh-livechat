# Interaction

[English](./interaction.md) | [中文](./interaction.zh-CN.md)


Everything you can touch: the floating control ball, hover-to-pause, click-for-detail, sending your own danmaku, the heat bar, and the little celebratory effects.

## Floating control ball (drag ball)

A small draggable ball sits over the conversation area (top-right by default). It's your always-on quick control:

- **Drag** to reposition — position persists in `localStorage` (`dsh-danmaku-ball-pos`) per-browser.
- **Click** to pop a quick-control menu: toggle danmaku on/off, pause/resume, open settings, send a message.
- **Idle** state shows a compact dot; **active** state (recent triggers) shows a livelier pop.

The ball hides when danmaku is fully disabled, and reappears on re-enable.

### Position persistence and window resize

The stored position is a **viewport-relative ratio** (`rx`/`ry`, 0–1) plus the pixel values it was derived from (`x`/`y`/`vw`/`vh`), anchored to the whole viewport (`window.innerWidth` / `innerHeight`). When the window changes size the ball repositions proportionally: a ball parked at the right edge stays at the right edge after maximizing.

Two rules govern the conversion:

- **Clamp outranks ratio.** The ratio-derived pixel position still goes through the shared clamp, so the ball is always reachable on screen. When the window shrinks, the ball may sit off its exact ratio — keeping it on screen matters more than keeping the proportion.
- **Legacy pixel records migrate once.** A record saved by an older version with only `x`/`y` (no `rx`/`ry`) is clamped to the current viewport once and converted to a ratio immediately, so existing users get the resize behavior without having to drag the ball again. Zero-size or non-finite viewports skip the write rather than persisting a bad ratio.

Drag, restore and resize all three go through the same clamp function.

### Desktop titlebar

On the desktop client the ball cannot rest inside the Windows titlebar strip at the top of the window, whose height comes from `--dsh-windows-titlebar-height` (40px on Windows). Dragging, restoring and resizing all respect this floor, so the ball never hides under the titlebar.

### Known issue: pop menu overflow

Once the ball can follow a ratio it can sit very close to the bottom or right edge, and its pop menu is positioned at `top: ballY + 48` / `left: min(ballX, innerWidth - 250)` without a viewport fit. At 1440×900 the menu has been measured overflowing the viewport (`top: 748, bottom: 1125, right: 1446` against `1440×900`). This is registered as a known issue and is intentionally not fixed in this release.

## Hover pause

With `hoverPause: true` (default), hovering any danmaku item freezes it in place so you can read it. Move away and it resumes scrolling. This is client-side only — no server round-trip, no jank.

**Paused danmaku never auto-expire** (Bilibili-like): while a stay is frozen (hover or detail lock), it remains on screen indefinitely. It is only removed after it resumes and scrolls out of range, on session switch, or when dsh closes.

## Click for detail

Click a danmaku to open a detail popover with the comment text and source badge. **Only the clicked danmaku freezes**; the rest keep rolling. Closing the detail unlocks that item (it stays paused only if still hovered).

| Source badge | Meaning |
|---|---|
| 📺 | Preset pack |
| 🤖 | LLM-generated |
| 💬 | User-sent |

From the popover you can **copy** the text, **block** the content (adds to `blockedWords`), or **delete** it from the session pool (if it's a pool item).

## User-sent danmaku

`userSend: true` (default) enables a text input in the quick-control menu (or via the ball). Type a short message and send — it floats across as a `source: 'user'` item, joins the session pool, and becomes eligible for history replay + like-boosting. Same `styleMaxChars` / `blockedWords` caps apply.

## Heat bar

`showHeat: true` (default) renders a thin heat indicator that reflects how busy the session is right now. The host computes a heat score from recent triggers (`/api/danmaku/heat`):

| Event | Score |
|---|---|
| `tool_call` | 1.5 |
| `tool_error` | 2.5 |
| `user_message` | 2.0 |
| `reply_complete` | 2.0 |
| `task_done` | 4.0 |
| other | 0.5 |

Score is normalized to 0–1 over a configurable `window` (default 30s). High heat brightens the overlay past idle-opacity; low heat lets it dim. So the overlay visually "breathes" with activity.

## Celebratory & ambient effects

Small toggleable flourishes tied to events:

| Effect | Config | What it does |
|---|---|---|
| Welcome on enter | `welcomeOnEnter` (default true) | A short welcome burst when you enter/switch a session |
| Task-done rain | `taskDoneRain` (default true) | A confetti-style rain of danmaku when a task completes |
| Tool-error banner | `toolErrorSc` (default true) | A scolding burst when a tool call errors |
| Allow emoji | `allowEmoji` (default true) | Lets danmaku content include emoji |

## Debug source badges

`debugSource: true` prefixes every on-screen item with its source emoji (📺/🤖/💬) so you can see at a glance where comments originate while tuning. Off in normal use.
