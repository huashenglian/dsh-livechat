# Interaction

[English](./interaction.md) | [中文](./interaction.zh-CN.md)


Everything you can touch: the floating control ball, hover-to-pause, click-for-detail, sending your own danmaku, the heat bar, and the little celebratory effects.

## Floating control ball (drag ball)

A small draggable ball sits over the conversation area (top-right by default). It's your always-on quick control:

- **Drag** to reposition — position persists in `localStorage` (`dsh-danmaku-ball-pos`) per-browser.
- **Click** to pop a quick-control menu: toggle danmaku on/off, pause/resume, open settings, send a message.
- **Idle** state shows a compact dot; **active** state (recent triggers) shows a livelier pop.

The ball hides when danmaku is fully disabled, and reappears on re-enable.

## Hover pause

With `hoverPause: true` (default), hovering any danmaku item freezes it in place so you can read it. Move away and it resumes scrolling. This is client-side only — no server round-trip, no jank.

## Click for detail

Click a danmaku to open a detail popover with the comment text and source badge:

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
