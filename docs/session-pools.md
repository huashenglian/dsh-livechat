# Session Pools

[English](./session-pools.md) | [中文](./session-pools.zh-CN.md)


How danmaku is remembered per session, replayed with decay, archived, restored, and edited — the memory that makes the crowd feel like *your* crowd, not a random noise generator.

## Per-session `.jsonl` pools

Every session gets its own danmaku pool at:

```
$DSH_HOME/danmaku-pools/<sessionId>.jsonl
```

(`$DSH_HOME` defaults to `~/.dsh`, i.e. `C:\Users\<you>\.dsh` on Windows.)

Each line is a JSON entry: `id`, `content`, `source` (`ai` in 0.6.13+; `preset`/`user` only in legacy files), `at` timestamp, `tags`, `weight`, `likes`. Only LLM (`source: 'ai'`) comments are appended — preset and user-sent comments are generated for display and never persisted. Legacy preset/user rows stay on disk but are filtered out by replay. The pool is capped at `maxPoolEntries` (default 200, oldest trimmed).

> [!IMPORTANT]
> Pool files are deleted when a session is **user-removed** (`api-session/removed`). They are **not** deleted on `session/disposed` (which fires on memory eviction, not user deletion) — so reopening a still-listed session still has its history.
>
> **Uninstalling the plugin** while the server is running also wipes the whole `danmaku-pools` directory. You can also clear all pools from the pool editor’s red **Clear all pools** button (with confirm), or `POST /api/danmaku/pools/clear`.

## History replay

`historyReplayEnabled: true` (default) lets older **AI pool entries** resurface as ambient danmaku, scored by:

- **Time decay** — half-life `halfLifeDays` (default 7). Older = exponentially lower score.
- **Like boost** — liked comments get `+15%` per like.
- **Weight** — each entry's `weight` (1–10, raised on like).
- **Tag match** — overlap between the entry's tags and current context tags (recent events + keywords). Below `matchThreshold` (default 0.35) it's skipped.

The top `historyReplayMax` (default 12) scored entries replay. This is why a session that's been talking about "regex" starts surfacing old regex-related banter again.

Legacy preset/user rows remain in the file and stay queryable through the pool API, but they are never scored for replay.

## Liking

Liking an AI danmaku (`POST /api/danmaku/like` with `source: 'ai'`) bumps its `likes` and `weight` (capped at 10), making it resurface more often. Only `source: 'ai'` rows are actionable: liking a preset or user item is a no-op (`{ok: true, liked: false}`) and never writes the pool. If the liked AI content isn't already in the pool, it's appended as a liked AI entry — so you can promote ad-hoc AI comments too.

## Archive & restore

To keep live pools lean, entries older than `archiveAfterDays` (default 60) move into an **archive** subfolder:

```
$DSH_HOME/danmaku-pools/archive/<sessionId>.jsonl
```

Archived entries are excluded from live replay but stay queryable via the pool API (`scope=archive` or `scope=all`). You can **restore** an archived item within `restoreMaxAgeHours` (default 168h / 7 days) — it moves back to live. Beyond that window, restore returns `too_old` and the item stays archived.

## Pool editor

The settings card exposes an in-app **pool editor** ("Open pool editor…"):

- Lists all sessions with their **real session names** (e.g. "帮我写一个…") plus live/archived counts and time ranges — the host folds titles for the whole page in one `ctx.sessionQuery.readTitleSnapshots()` batch, the same source dsh's own session list shows, falling back to a truncated session id when a session has no title
- Per session, browse live + archive scopes
- **Delete a whole session** with the **×** button on its card (0.6.10) — a confirmation dialog names the session and states the scope; confirming drops only that session's live + archive cache (`DELETE /api/danmaku/pool/session`). Other sessions are never touched
- Edit content / weight / tags inline
- Delete items (live or archived)
- Restore archived items (within the window)

All edits hit the pool HTTP routes — no file editing by hand.

## Heat & pools

The `/api/danmaku/heat` endpoint (see [interaction.md](interaction.md)) and pool listing (`/api/danmaku/pools`) compose the "who's here and how busy" picture the overlay breathes to.
