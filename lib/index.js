// dsh-danmaku — Host half.
// Registers the `danmaku` settings namespace, observes session events into a
// trigger ring buffer, serves config/trigger/LLM HTTP routes for the client
// half, and (optionally) generates danmaku via a configured LLM.

import { samplePresets, isBlocked, PRESET_PACKS } from './presets.js'
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync, renameSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const name = 'dsh-danmaku'
const inject = ['webServer', 'llm', 'settings']

// Minimal Standard Schema (no @deepseek-ai/schemastery — external link: packages
// cannot resolve dsh-private deps from their real path).
const Config = {
  '~standard': {
    version: 1,
    vendor: 'dsh-danmaku',
    validate(value) {
      return { value: value && typeof value === 'object' ? value : {} }
    },
  },
}

export const DANMAKU_NS = 'danmaku'

const DEFAULTS = {
  enabled: true,
  opacity: 0.85,
  opacityIdle: 0.15,
  antiOcclude: true,
  maxOnscreen: 40,
  fontSize: 16,
  crossSec: 8,
  scrollSpeed: 140,
  areaRatio: 0.5,
  layoutWeights: { roll: 80, top: 10, bottom: 10 },
  stroke: true,
  hoverPause: true,
  userSend: true,
  presetPack: 'general',
  blockedWords: [],
  stylePrompt: '吐槽风格，短促有力',
  styleMaxChars: 24,
  matchThreshold: 0.35,
  llmEnabled: true,
  llmIntervalSec: 18,
  llmModel: 'agnes/agnes-2.5-flash',
  llmBurstCount: 3,
  ambientMinMs: 1200,
  ambientMaxMs: 3200,
  maxPoolEntries: 200,
  historyReplayEnabled: true,
  historyReplayMax: 12,
  historyMaxAgeHours: 72,
  halfLifeDays: 7,
  archiveAfterDays: 60,
  restoreMaxAgeHours: 168,
  // Wake modes: smart | interval | toolcall
  wakeupType: 'smart',
  wakeupEvents: ['user_message', 'reply_complete'],
  smartMinGapSec: 8,
  intervalOnlyWhenActive: true,
  toolcallFilterMode: 'all',
  toolcallTools: [],
  toolcallOnErrorExtra: true,
  globalMinGapSec: 5,
  // Display extras
  uniformColor: false,
  color: '#FFFFFF',
  colorWeights: [
    { color: '#FFFFFF', weight: 70 },
    { color: '#89D5FF', weight: 15 },
    { color: '#FFFF00', weight: 10 },
    { color: '#FB7299', weight: 5 },
  ],
  allowEmoji: true,
  welcomeOnEnter: true,
  taskDoneRain: true,
  toolErrorSc: true,
  showHeat: true,
  debugSource: false,
  styleTemplates: [
    { id: 'tucao', name: '吐槽', prompt: '吐槽风格，短促有力，偶尔阴阳怪气但友善' },
    { id: 'praise', name: '称赞', prompt: '夸张称赞，像看到神仙操作的围观群众' },
    { id: 'cheer', name: '应援', prompt: '热血应援，短句高能，像粉丝打call' },
    { id: 'science', name: '科普', prompt: '用一两句通俗话点评技术点，有趣不装' },
    { id: 'repeat', name: '复读机', prompt: '简短重复热梗，像弹幕复读机' },
  ],
  renderBackend: 'dom',
}

const SettingsSchema = {
  '~standard': {
    version: 1,
    vendor: 'dsh-danmaku',
    validate(value) {
      try {
        return { value: clampConfig(value) }
      } catch (e) {
        return { issues: [{ message: String(e && e.message ? e.message : e) }] }
      }
    },
  },
}

const TRIGGER_LIMIT = 128
const LLM_MIN_GAP_MS = 5000
const LLM_TIMEOUT_MS = 12000

/** @returns {typeof DEFAULTS} */
function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULTS))
}

function clampConfig(raw) {
  const base = cloneDefaults()
  if (!raw || typeof raw !== 'object') return base
  const out = { ...base, ...raw }
  out.enabled = out.enabled !== false
  out.opacity = clampNum(out.opacity, 0.1, 1, DEFAULTS.opacity)
  out.opacityIdle = clampNum(out.opacityIdle, 0, 0.8, DEFAULTS.opacityIdle)
  out.antiOcclude = out.antiOcclude !== false
  out.maxOnscreen = Math.floor(clampNum(out.maxOnscreen, 1, 200, DEFAULTS.maxOnscreen))
  out.fontSize = Math.floor(clampNum(out.fontSize, 12, 36, DEFAULTS.fontSize))
  out.crossSec = clampNum(out.crossSec, 3, 20, DEFAULTS.crossSec)
  out.scrollSpeed = clampNum(out.scrollSpeed, 40, 400, DEFAULTS.scrollSpeed)
  out.areaRatio = clampNum(out.areaRatio, 0.25, 1, DEFAULTS.areaRatio)
  const lw = out.layoutWeights && typeof out.layoutWeights === 'object' ? out.layoutWeights : {}
  out.layoutWeights = {
    roll: clampNum(lw.roll, 0, 100, 80),
    top: clampNum(lw.top, 0, 100, 10),
    bottom: clampNum(lw.bottom, 0, 100, 10),
  }
  out.stroke = out.stroke !== false
  out.hoverPause = out.hoverPause !== false
  out.userSend = out.userSend !== false
  if (!PRESET_PACKS[out.presetPack]) out.presetPack = 'general'
  out.blockedWords = Array.isArray(out.blockedWords)
    ? out.blockedWords.map((w) => String(w)).filter(Boolean)
    : []
  out.stylePrompt = String(out.stylePrompt || DEFAULTS.stylePrompt)
  out.styleMaxChars = Math.floor(clampNum(out.styleMaxChars, 8, 48, DEFAULTS.styleMaxChars))
  out.matchThreshold = clampNum(out.matchThreshold, 0, 1, DEFAULTS.matchThreshold)
  out.llmEnabled = out.llmEnabled === true
  out.llmIntervalSec = Math.floor(clampNum(out.llmIntervalSec, 5, 120, DEFAULTS.llmIntervalSec))
  out.llmModel = String(out.llmModel || DEFAULTS.llmModel)
  out.llmBurstCount = Math.floor(clampNum(out.llmBurstCount, 1, 10, DEFAULTS.llmBurstCount))
  out.ambientMinMs = Math.floor(clampNum(out.ambientMinMs, 400, 10000, DEFAULTS.ambientMinMs))
  out.ambientMaxMs = Math.floor(clampNum(out.ambientMaxMs, out.ambientMinMs + 200, 20000, DEFAULTS.ambientMaxMs))
  out.maxPoolEntries = Math.floor(clampNum(out.maxPoolEntries, 20, 2000, DEFAULTS.maxPoolEntries))
  out.historyReplayEnabled = out.historyReplayEnabled !== false
  out.historyReplayMax = Math.floor(clampNum(out.historyReplayMax, 0, 50, DEFAULTS.historyReplayMax))
  out.historyMaxAgeHours = Math.floor(clampNum(out.historyMaxAgeHours, 1, 720, DEFAULTS.historyMaxAgeHours))
  out.halfLifeDays = clampNum(out.halfLifeDays, 0.5, 30, DEFAULTS.halfLifeDays)
  out.archiveAfterDays = Math.floor(clampNum(out.archiveAfterDays, 1, 365, DEFAULTS.archiveAfterDays))
  out.restoreMaxAgeHours = Math.floor(clampNum(out.restoreMaxAgeHours, 1, 720, DEFAULTS.restoreMaxAgeHours))
  if (!['smart', 'interval', 'toolcall'].includes(out.wakeupType)) out.wakeupType = 'smart'
  out.wakeupEvents = Array.isArray(out.wakeupEvents)
    ? out.wakeupEvents.filter((e) => ['user_message', 'reply_complete', 'tool_call', 'task_done', 'tool_error'].includes(e))
    : [...DEFAULTS.wakeupEvents]
  out.smartMinGapSec = clampNum(out.smartMinGapSec, 3, 60, DEFAULTS.smartMinGapSec)
  out.intervalOnlyWhenActive = out.intervalOnlyWhenActive !== false
  if (!['all', 'whitelist', 'blacklist'].includes(out.toolcallFilterMode)) out.toolcallFilterMode = 'all'
  out.toolcallTools = Array.isArray(out.toolcallTools) ? out.toolcallTools.map(String).filter(Boolean) : []
  out.toolcallOnErrorExtra = out.toolcallOnErrorExtra !== false
  out.globalMinGapSec = clampNum(out.globalMinGapSec, 1, 60, DEFAULTS.globalMinGapSec)
  out.uniformColor = out.uniformColor === true
  out.color = /^#[0-9A-Fa-f]{6}$/.test(String(out.color || '')) ? out.color : DEFAULTS.color
  out.colorWeights = Array.isArray(out.colorWeights) && out.colorWeights.length
    ? out.colorWeights
        .map((x) => ({
          color: /^#[0-9A-Fa-f]{6}$/.test(String(x && x.color)) ? x.color : '#FFFFFF',
          weight: clampNum(x && x.weight, 0, 100, 0),
        }))
        .filter((x) => x.weight > 0)
    : cloneDefaults().colorWeights
  if (!out.colorWeights.length) out.colorWeights = cloneDefaults().colorWeights
  out.allowEmoji = out.allowEmoji !== false
  out.welcomeOnEnter = out.welcomeOnEnter !== false
  out.taskDoneRain = out.taskDoneRain !== false
  out.toolErrorSc = out.toolErrorSc !== false
  out.showHeat = out.showHeat !== false
  out.debugSource = out.debugSource === true
  out.styleTemplates = Array.isArray(out.styleTemplates) && out.styleTemplates.length
    ? out.styleTemplates
    : cloneDefaults().styleTemplates
  if (!['auto', 'dom', 'webgl2', 'webgl2-main', 'webgl2-worker'].includes(out.renderBackend)) out.renderBackend = 'auto'
  return out
}

function clampNum(v, min, max, fallback) {
  const n = Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(payload)
}

function extractEventText(event) {
  const type = event && event.type
  const data = event?.data || {}
  // Prefer assistant visible reply body (skip reasoning chunks)
  if (type === 'assistant/chunk') {
    const chunk = data.chunk || data
    if (chunk && chunk.type === 'text-delta' && typeof chunk.text === 'string') {
      return chunk.text
    }
    return ''
  }
  if (type === 'assistant/message' || type === 'assistant/attempt') {
    const msg = data.message || data
    const blocks = msg && msg.content
    if (Array.isArray(blocks)) {
      return blocks
        .filter((b) => b && b.type === 'text')
        .map((b) => b.text || '')
        .join(' ')
    }
    if (typeof msg?.text === 'string') return msg.text
  }
  const candidates = [
    data.text,
    typeof data.content === 'string' ? data.content : null,
    typeof data.message === 'string' ? data.message : null,
    data.message && typeof data.message.content === 'string' ? data.message.content : null,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c
  }
  return ''
}

function mapEventType(event) {
  const type = event && event.type
  if (!type) return null
  if (type === 'user/message' || type === 'user/message-notice') return 'user_message'
  if (type === 'turn/end' || type === 'turn/complete') return 'reply_complete'
  if (type === 'tool/result') {
    const data = event.data || {}
    if (data.ok === false || data.error) return 'tool_error'
    return 'tool_call'
  }
  if (type === 'tool/call') return 'tool_call'
  if (type === 'task/done' || type === 'goal/completed') return 'task_done'
  if (type === 'assistant/message') return 'reply_complete'
  // structural activity (not a burst wake by itself)
  if (type === 'step/start' || type === 'step/end' || type === 'turn/start') return 'step'
  if (type === 'todo/write') return 'todo'
  return null
}

function toolMatchesFilter(toolName, cfg) {
  const name = String(toolName || '')
  const list = cfg.toolcallTools || []
  if (cfg.toolcallFilterMode === 'all' || !list.length) return true
  const hit = list.some((t) => name === t || name.includes(t))
  if (cfg.toolcallFilterMode === 'whitelist') return hit
  if (cfg.toolcallFilterMode === 'blacklist') return !hit
  return true
}

/** Whether this event should trigger LLM generation under current wakeupType. */
function shouldLlmWake(kind, meta, cfg) {
  if (!cfg.llmEnabled) return false
  if (kind === 'tool_error') {
    return cfg.toolcallOnErrorExtra !== false && (cfg.wakeupType === 'toolcall' || cfg.wakeupType === 'smart')
  }
  if (cfg.wakeupType === 'interval') return false
  if (cfg.wakeupType === 'toolcall') {
    if (kind !== 'tool_call') return false
    return toolMatchesFilter(meta && meta.tool, cfg)
  }
  // smart
  const events = cfg.wakeupEvents && cfg.wakeupEvents.length ? cfg.wakeupEvents : DEFAULTS.wakeupEvents
  if (!events.includes(kind)) return false
  if (kind === 'tool_call') return toolMatchesFilter(meta && meta.tool, cfg)
  return true
}

function buildLlmPrompt(cfg, recent, events) {
  const style = cfg.stylePrompt
  const n = cfg.llmBurstCount
  const lines = []
  lines.push('你是围观 AI 编程 agent 工作的弹幕观众集合。请生成简短、有趣、有围观氛围的中文弹幕。')
  lines.push(`风格：${style}`)
  lines.push(`条数：恰好 ${n} 条；每条不超过 ${cfg.styleMaxChars || 24} 个字符。`)
  lines.push('禁止：剧透后续步骤、泄露密钥或路径隐私、与当前上下文无关的内容。')
  if (events && events.length) lines.push(`最近事件：${events.slice(-5).join('；')}`)
  if (recent && recent.length) lines.push(`最近对话摘要：\n${recent.slice(-6).map((r) => `- ${r}`).join('\n')}`)
  lines.push('只输出 JSON 数组，格式：[{"content":"..."}]，不要输出其他文字。')
  return lines.join('\n')
}

function parseLlmJson(text) {
  if (!text) return []
  const trimmed = String(text).trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fenced ? fenced[1] : trimmed
  const start = body.indexOf('[')
  const end = body.lastIndexOf(']')
  if (start >= 0 && end > start) {
    try {
      const arr = JSON.parse(body.slice(start, end + 1))
      if (Array.isArray(arr)) {
        return arr
          .map((x) => {
            if (typeof x === 'string') return x.trim()
            if (x && typeof x.content === 'string') return x.content.trim()
            if (x && typeof x.text === 'string') return x.text.trim()
            return ''
          })
          .filter((s) => s && s.length <= 48)
      }
    } catch {
      /* fall through */
    }
  }
  // Fallback: split short lines that look like danmaku
  return body
    .split(/\n+/)
    .map((s) => s.replace(/^[-*•\d.\s]+/, '').replace(/^["'「]|["'」]$/g, '').trim())
    .filter((s) => s && s.length >= 2 && s.length <= 48 && !/^[{\[]/.test(s))
    .slice(0, 5)
}

async function collectLlmText(ctx, modelId, messages) {
  const providers = typeof ctx.llm.listProviders === 'function' ? ctx.llm.listProviders() : []
  const providerIds = (Array.isArray(providers) ? providers : [])
    .map((p) => (p && typeof p === 'object' ? (p.id || p.name || p.provider) : p))
    .filter(Boolean)
  let provider
  let model = modelId
  if (modelId && modelId.includes('/')) {
    const idx = modelId.indexOf('/')
    provider = modelId.slice(0, idx)
    model = modelId.slice(idx + 1)
  } else {
    provider = providerIds[0]
  }
  if (!provider) throw new Error('no llm provider, have=' + JSON.stringify(providerIds))
  console.log('[dsh-danmaku] llm call provider=', provider, 'model=', model, 'known=', providerIds.join(','))

  const stream = ctx.llm.stream({
    provider,
    model: model || undefined,
    messages,
  })

  let text = ''
  const started = Date.now()
  for await (const chunk of stream) {
    if (Date.now() - started > LLM_TIMEOUT_MS) break
    if (!chunk || typeof chunk !== 'object') continue
    if (chunk.type === 'text-delta' && typeof chunk.text === 'string') {
      text += chunk.text
      continue
    }
    if (chunk.type === 'finish') {
      if (chunk.kind === 'error') {
        console.warn('[dsh-danmaku] llm finish error', chunk.failure && chunk.failure.code, chunk.failure && chunk.failure.message)
      }
      break
    }
    const delta = chunk.delta ?? chunk.content ?? chunk.text
    if (typeof delta === 'string') text += delta
    else if (Array.isArray(chunk?.content)) {
      for (const block of chunk.content) {
        if (block && typeof block.text === 'string') text += block.text
      }
    }
  }
  return text
}

function makeMessages(systemText, userText) {
  return [
    {
      id: 'sys_' + Math.random().toString(36).slice(2, 10),
      role: 'system',
      content: [{ type: 'text', text: systemText }],
      source: { kind: 'plugin', plugin: 'dsh-danmaku' },
    },
    {
      id: 'usr_' + Math.random().toString(36).slice(2, 10),
      role: 'user',
      content: [{ type: 'text', text: userText }],
      source: { kind: 'plugin', plugin: 'dsh-danmaku' },
    },
  ]
}

// ---- per-session danmaku pool files ----
function poolDir() {
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  return join(home, 'danmaku-pools')
}

function safeSessionId(id) {
  return String(id || '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
}

function poolPath(sessionId) {
  return join(poolDir(), safeSessionId(sessionId) + '.jsonl')
}

function ensurePoolDir() {
  try {
    mkdirSync(poolDir(), { recursive: true })
  } catch {
    /* ignore */
  }
}

function readPool(sessionId) {
  const p = poolPath(sessionId)
  if (!existsSync(p)) return []
  try {
    const raw = readFileSync(p, 'utf8')
    return raw
      .split('\n')
      .map((line) => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

function appendPool(sessionId, entries, maxEntries) {
  if (!sessionId || !entries || !entries.length) return
  ensurePoolDir()
  const p = poolPath(sessionId)
  const lines = entries.map((e) =>
    JSON.stringify({
      id: e.id || `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      content: String(e.content || '').slice(0, 48),
      source: e.source || 'preset',
      at: e.at || Date.now(),
      tags: e.tags || [],
      weight: Number(e.weight) || 1,
      likes: Number(e.likes) || 0,
    }),
  )
  try {
    const existing = readPool(sessionId)
    const next = existing.concat(entries.map((e, i) => JSON.parse(lines[i])))
    const trimmed = next.slice(-Math.max(1, maxEntries || 200))
    writeFileSync(p, trimmed.map((x) => JSON.stringify(x)).join('\n') + '\n', 'utf8')
  } catch (err) {
    try {
      writeFileSync(p, lines.join('\n') + '\n', { flag: 'a', encoding: 'utf8' })
    } catch {
      /* ignore */
    }
  }
}

/** Like a danmaku by content in a session pool: bump likes + weight. */
function likeInPool(sessionId, content) {
  if (!sessionId || !content) return { ok: false, reason: 'missing' }
  const all = readPool(sessionId)
  if (!all.length) return { ok: false, reason: 'empty' }
  const target = String(content).slice(0, 48)
  let hit = false
  const next = all.map((e) => {
    if (String(e.content) === target) {
      hit = true
      return {
        ...e,
        likes: (Number(e.likes) || 0) + 1,
        weight: Math.min(10, (Number(e.weight) || 1) + 0.5),
      }
    }
    return e
  })
  if (!hit) {
    // append as a liked entry so future sampling can use it
    next.push({
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      content: target,
      source: 'user',
      at: Date.now(),
      tags: ['liked'],
      weight: 1.5,
      likes: 1,
    })
    const max = 200
    while (next.length > max) next.shift()
  }
  try {
    ensurePoolDir()
    writeFileSync(poolPath(sessionId), next.map((x) => JSON.stringify(x)).join('\n') + '\n', 'utf8')
  } catch {
    return { ok: false, reason: 'write' }
  }
  return { ok: true, liked: hit }
}

function deletePool(sessionId) {
  try {
    const p = poolPath(sessionId)
    if (existsSync(p)) unlinkSync(p)
  } catch {
    /* ignore */
  }
}

function listPoolFiles() {
  try {
    return readdirSync(poolDir()).filter((f) => f.endsWith('.jsonl'))
  } catch {
    return []
  }
}

function archivePath(sessionId) {
  return join(archiveDir(), safeSessionId(sessionId) + '.jsonl')
}

function readArchive(sessionId) {
  const p = archivePath(sessionId)
  if (!existsSync(p)) return []
  try {
    return readFileSync(p, 'utf8')
      .split('\n')
      .map((line) => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

function writeArchive(sessionId, items) {
  ensurePoolDir()
  mkdirSync(archiveDir(), { recursive: true })
  writeFileSync(archivePath(sessionId), items.map((x) => JSON.stringify(x)).join('\n') + (items.length ? '\n' : ''), 'utf8')
}

function writeLive(sessionId, items) {
  ensurePoolDir()
  if (!items.length) {
    try {
      unlinkSync(poolPath(sessionId))
    } catch {
      /* ignore */
    }
    return
  }
  writeFileSync(poolPath(sessionId), items.map((x) => JSON.stringify(x)).join('\n') + '\n', 'utf8')
}

function listPools() {
  ensurePoolDir()
  const sessions = []
  const seen = new Set()
  for (const f of listPoolFiles()) {
    const sid = f.replace(/\.jsonl$/, '')
    seen.add(sid)
    const live = readPool(sid)
    const archived = readArchive(sid)
    sessions.push({
      sessionId: sid,
      live: live.length,
      archived: archived.length,
      oldest: live[0]?.at || archived[0]?.at || null,
      newest: live.length ? live[live.length - 1].at : archived.length ? archived[archived.length - 1].at : null,
    })
  }
  try {
    for (const f of readdirSync(archiveDir()).filter((x) => x.endsWith('.jsonl'))) {
      const sid = f.replace(/\.jsonl$/, '')
      if (seen.has(sid)) continue
      const archived = readArchive(sid)
      sessions.push({
        sessionId: sid,
        live: 0,
        archived: archived.length,
        oldest: archived[0]?.at || null,
        newest: archived.length ? archived[archived.length - 1].at : null,
      })
    }
  } catch {
    /* no archive dir */
  }
  sessions.sort((a, b) => (b.newest || 0) - (a.newest || 0))
  return sessions
}

function poolItems(sessionId, scope) {
  const live = readPool(sessionId).map((x) => ({ ...x, scope: 'live' }))
  const arch = readArchive(sessionId).map((x) => ({ ...x, scope: 'archive' }))
  if (scope === 'live') return live
  if (scope === 'archive') return arch
  return live.concat(arch)
}

function patchPoolItem(sessionId, id, patch) {
  const live = readPool(sessionId)
  let hit = false
  const next = live.map((e) => {
    if (e.id !== id) return e
    hit = true
    const merged = { ...e }
    if (typeof patch.content === 'string') merged.content = String(patch.content).slice(0, 48)
    if (patch.weight !== undefined) merged.weight = clampNum(patch.weight, 0, 10, e.weight || 1)
    if (Array.isArray(patch.tags)) merged.tags = patch.tags.map(String)
    return merged
  })
  if (hit) {
    writeLive(sessionId, next)
    return { ok: true, scope: 'live' }
  }
  const arch = readArchive(sessionId)
  let aHit = false
  const aNext = arch.map((e) => {
    if (e.id !== id) return e
    aHit = true
    const merged = { ...e }
    if (typeof patch.content === 'string') merged.content = String(patch.content).slice(0, 48)
    if (patch.weight !== undefined) merged.weight = clampNum(patch.weight, 0, 10, e.weight || 1)
    if (Array.isArray(patch.tags)) merged.tags = patch.tags.map(String)
    return merged
  })
  if (aHit) {
    writeArchive(sessionId, aNext)
    return { ok: true, scope: 'archive' }
  }
  return { ok: false, reason: 'not_found' }
}

function deletePoolItem(sessionId, id, scope) {
  if (scope !== 'archive') {
    const live = readPool(sessionId)
    const next = live.filter((e) => e.id !== id)
    if (next.length !== live.length) {
      writeLive(sessionId, next)
      return { ok: true, scope: 'live' }
    }
  }
  if (scope !== 'live') {
    const arch = readArchive(sessionId)
    const aNext = arch.filter((e) => e.id !== id)
    if (aNext.length !== arch.length) {
      writeArchive(sessionId, aNext)
      return { ok: true, scope: 'archive' }
    }
  }
  return { ok: false, reason: 'not_found' }
}

function restorePoolItem(sessionId, id, restoreMaxAgeHours) {
  const arch = readArchive(sessionId)
  const idx = arch.findIndex((e) => e.id === id)
  if (idx < 0) return { ok: false, reason: 'not_found' }
  const item = arch[idx]
  const maxMs = (restoreMaxAgeHours || DEFAULTS.restoreMaxAgeHours) * 3600 * 1000
  if (Date.now() - (item.at || 0) > maxMs) {
    return { ok: false, reason: 'too_old', at: item.at }
  }
  const aNext = arch.filter((e) => e.id !== id)
  writeArchive(sessionId, aNext)
  const live = readPool(sessionId)
  const restored = { ...item, restoredAt: Date.now() }
  live.push(restored)
  writeLive(sessionId, live)
  return { ok: true, item: restored }
}

function ctxTagsFrom(recent, triggers) {
  const tags = []
  const lastTrig = (triggers || []).slice(-8)
  for (const t of lastTrig) {
    if (t.kind) tags.push(t.kind)
    if (t.meta && t.meta.tool) tags.push(String(t.meta.tool).toLowerCase())
  }
  const text = (recent || []).slice(-3).join(' ')
  const words = String(text).toLowerCase().match(/[\p{L}\p{N}]{2,12}/gu) || []
  for (const w of words.slice(0, 6)) tags.push(w)
  return Array.from(new Set(tags))
}

function historyFor(sessionId, cfg, ctxTagList) {
  if (cfg.historyReplayEnabled === false) return []
  const all = readPool(sessionId)
  const maxAgeMs = (cfg.historyMaxAgeHours || 72) * 3600 * 1000
  const cutoff = Date.now() - maxAgeMs
  const halfLifeDays = cfg.halfLifeDays || 7
  const now = Date.now()
  const ctxTags = new Set((ctxTagList || []).map((t) => String(t).toLowerCase()))
  const thr = cfg.matchThreshold != null ? cfg.matchThreshold : 0.35
  const scored = all
    .filter((e) => (e.at || 0) >= cutoff)
    .map((e) => {
      const ageDays = (now - (e.at || now)) / 86400000
      const decay = Math.pow(0.5, ageDays / halfLifeDays)
      const likeBoost = 1 + 0.15 * (Number(e.likes) || 0)
      const weight = Number(e.weight) || 1
      const tags = Array.isArray(e.tags) ? e.tags : []
      let match = 0.9
      if (tags.length && ctxTags.size) {
        let hit = 0
        for (const tag of tags) if (ctxTags.has(String(tag).toLowerCase())) hit++
        match = hit / tags.length
      }
      if (match < thr) return { e, score: -1, match }
      return { e, score: decay * weight * likeBoost * match, match }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  const max = Math.max(0, cfg.historyReplayMax || 12)
  return scored.slice(0, max).map((x) => x.e)
}

function archiveDir() {
  return join(poolDir(), 'archive')
}

/** Move entries older than archiveAfterDays into archive/ (keep file, not delete live). */
function archiveOldEntries(sessionId, cfg) {
  const days = cfg.archiveAfterDays || 60
  const cutoff = Date.now() - days * 86400000
  const all = readPool(sessionId)
  if (!all.length) return { moved: 0 }
  const keep = []
  const old = []
  for (const e of all) {
    if ((e.at || 0) < cutoff) old.push(e)
    else keep.push(e)
  }
  if (!old.length) return { moved: 0 }
  try {
    mkdirSync(archiveDir(), { recursive: true })
    const ap = join(archiveDir(), safeSessionId(sessionId) + '.jsonl')
    appendFileSync(ap, old.map((x) => JSON.stringify(x)).join('\n') + '\n', 'utf8')
    if (keep.length) writeFileSync(poolPath(sessionId), keep.map((x) => JSON.stringify(x)).join('\n') + '\n', 'utf8')
    else unlinkSync(poolPath(sessionId))
    return { moved: old.length }
  } catch {
    return { moved: 0 }
  }
}

function poolStats(sessionId, cfg) {
  const live = readPool(sessionId)
  let archived = 0
  try {
    const ap = join(archiveDir(), safeSessionId(sessionId) + '.jsonl')
    if (existsSync(ap)) {
      archived = readFileSync(ap, 'utf8').split('\n').filter(Boolean).length
    }
  } catch {
    /* ignore */
  }
  return {
    sessionId,
    live: live.length,
    archived,
    oldest: live[0] && live[0].at ? live[0].at : null,
    newest: live.length ? live[live.length - 1].at : null,
    maxEntries: cfg.maxPoolEntries,
  }
}

function apply(ctx, _config) {
  let live = cloneDefaults()
  const triggers = []
  const recentLines = []
  let lastLlmAt = 0
  let lastLlmItems = []
  let currentSessionId = null

  const pushTrigger = (kind, meta) => {
    triggers.push({
      id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      kind,
      at: Date.now(),
      sessionId: currentSessionId,
      meta: meta || {},
    })
    if (triggers.length > TRIGGER_LIMIT) triggers.splice(0, triggers.length - TRIGGER_LIMIT)
  }

  const pushRecent = (text) => {
    const line = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 120)
    if (!line) return
    recentLines.push(line)
    if (recentLines.length > 20) recentLines.splice(0, recentLines.length - 20)
  }

  const recordToPool = (items, source) => {
    if (!currentSessionId || !items || !items.length) return
    appendPool(
      currentSessionId,
      items.map((it) => ({
        content: it.content,
        source: it.source || source || 'preset',
        tags: it.tags || [],
        at: Date.now(),
      })),
      live.maxPoolEntries,
    )
  }

  // ---- settings namespace (best-effort; HTTP remains authoritative) ----
  if (ctx.settings && typeof ctx.settings.installSection === 'function') {
    try {
      ctx.settings.installSection(ctx, DANMAKU_NS, SettingsSchema, cloneDefaults(), {
        setSource: (source) => {
          try {
            live = clampConfig(typeof source === 'function' ? source() : source)
          } catch {
            /* keep previous */
          }
        },
        onChange: () => {
          try {
            const scope = ctx.settings.get(DANMAKU_NS)
            if (scope) live = clampConfig(scope)
          } catch {
            /* ignore */
          }
        },
      })
    } catch (e) {
      console.warn('[dsh-danmaku] settings.installSection skipped:', e && e.message)
    }
  }

  // ---- session event observation ----
  const onSessionEvent = (session, event) => {
    try {
      const sid = session && session.id
      if (sid && sid !== currentSessionId) currentSessionId = sid
      const kind = mapEventType(event)
      const text = extractEventText(event)
      if (text) pushRecent(text)
      if (!kind) return
      const data = event?.data || {}
      pushTrigger(kind, {
        sessionId: sid,
        tool: data.name || data.toolName || data.tool,
        ok: data.ok !== false && !data.error,
        preview: text.slice(0, 80),
      })
    } catch {
      /* never break the session stream */
    }
  }
  ctx.on('session/event', onSessionEvent)

  // Session removed → drop its danmaku pool file
  const onSessionRemoved = (sessionId) => {
    try {
      deletePool(sessionId)
      if (currentSessionId === sessionId) currentSessionId = null
      console.log('[dsh-danmaku] pool removed for session', sessionId)
    } catch {
      /* ignore */
    }
  }
  ctx.on('api-session/removed', onSessionRemoved)
  // NOTE: do NOT delete pools on session/disposed — that fires on memory
  // eviction, not user deletion. Only api-session/removed is user-facing delete.

  ensurePoolDir()

  // ---- HTTP routes (kind: exact, one handler per path) ----
  const webServer = ctx.get('webServer')
  if (webServer) {
    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/health',
      handler: async (_req, res) => {
        sendJson(res, 200, { ok: true, name, version: '0.1.0' })
      },
    })

    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/config',
      handler: async (req, res) => {
        if (req.method === 'GET') {
          sendJson(res, 200, { config: live })
          return
        }
        if (req.method === 'POST') {
          try {
            const body = await readBody(req)
            const patch = body && body.config ? body.config : body
            const merged = clampConfig({ ...live, ...patch })
            live = merged
            if (ctx.settings && typeof ctx.settings.update === 'function') {
              try {
                await ctx.settings.update(DANMAKU_NS, merged)
              } catch {
                // settings write is best-effort; HTTP remains authoritative for the client
              }
            }
            sendJson(res, 200, { config: live })
          } catch (e) {
            sendJson(res, 400, { error: String(e && e.message ? e.message : e) })
          }
          return
        }
        sendJson(res, 405, { error: 'method not allowed' })
      },
    })

    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/triggers',
      handler: async (req, res) => {
        let since = 0
        try {
          const url = new URL(req.url, 'http://127.0.0.1')
          since = Number(url.searchParams.get('since') || 0) || 0
        } catch {
          /* default 0 */
        }
        const items = triggers.filter((t) => t.at > since)
        sendJson(res, 200, { triggers: items, now: Date.now() })
      },
    })

    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/generate',
      handler: async (req, res) => {
        try {
          const body = await readBody(req)
          const event = body?.event || 'interval'
          const sid = body?.sessionId || currentSessionId
          const now = Date.now()

          if (!live.llmEnabled) {
            const items = samplePresets(live.presetPack, event, {
              count: live.llmBurstCount,
              blockedWords: live.blockedWords,
            })
            if (sid) appendPool(sid, items, live.maxPoolEntries)
            return sendJson(res, 200, { items, source: 'preset', reason: 'llm-disabled' })
          }

          if (now - lastLlmAt < Math.max(1000, (live.globalMinGapSec || 5) * 1000) && lastLlmItems.length) {
            return sendJson(res, 200, { items: lastLlmItems, source: 'ai', reason: 'throttled' })
          }

          const prompt = buildLlmPrompt(live, recentLines, triggers.slice(-6).map((t) => t.kind))
          let items = []
          try {
            const text = await collectLlmText(ctx, live.llmModel, makeMessages(
              '你只输出 JSON 数组，不要输出其他文字。',
              prompt,
            ))
            console.log('[dsh-danmaku] llm raw=', JSON.stringify(text.slice(0, 200)), 'model=', live.llmModel)
            items = parseLlmJson(text)
              .filter((c) => !isBlocked(c, live.blockedWords))
              .slice(0, live.llmBurstCount)
              .map((content) => ({
                content,
                source: 'ai',
                tags: ctxTagsFrom(recentLines, triggers),
              }))
          } catch (e) {
            console.warn('[dsh-danmaku] llm failed:', e && e.message)
            items = []
          }

          if (items.length === 0) {
            items = samplePresets(live.presetPack, event, {
              count: live.llmBurstCount,
              blockedWords: live.blockedWords,
            })
            if (sid) appendPool(sid, items, live.maxPoolEntries)
            return sendJson(res, 200, { items, source: 'preset', reason: 'llm-fallback' })
          }

          lastLlmAt = now
          lastLlmItems = items
          if (sid) appendPool(sid, items, live.maxPoolEntries)
          sendJson(res, 200, { items, source: 'ai' })
        } catch (e) {
          sendJson(res, 500, { error: String(e && e.message ? e.message : e) })
        }
      },
    })

    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/models',
      handler: async (_req, res) => {
        try {
          const providers = ctx.llm.listProviders()
          const groups = []
          for (const info of providers) {
            const provider = info && typeof info === 'object' ? (info.id || info.name || info.provider) : info
            if (!provider) continue
            try {
              const adapter = ctx.llm.registration(provider).adapter
              const listed = await adapter.listModels(provider)
              const models = (Array.isArray(listed) ? listed : [])
                .map((m) => ({ id: m.id || m.name || '', name: m.name || m.id || '' }))
                .filter((m) => m.id)
              if (models.length) groups.push({ provider, models })
            } catch {
              /* skip provider */
            }
          }
          sendJson(res, 200, { groups })
        } catch (e) {
          sendJson(res, 500, { error: String(e && e.message ? e.message : e) })
        }
      },
    })

    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/preset-sample',
      handler: async (req, res) => {
        try {
          const body = await readBody(req)
          const event = body?.event || 'user_message'
          const count = Math.floor(Number(body?.count) || undefined)
          const sid = body?.sessionId || currentSessionId
          const items = samplePresets(live.presetPack, event, {
            count: Number.isFinite(count) ? count : undefined,
            blockedWords: live.blockedWords,
          })
          if (sid) appendPool(sid, items, live.maxPoolEntries)
          sendJson(res, 200, { items })
        } catch (e) {
          sendJson(res, 400, { error: String(e && e.message ? e.message : e) })
        }
      },
    })

    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/pool',
      handler: async (req, res) => {
        try {
          const url = new URL(req.url, 'http://127.0.0.1')
          const sid = url.searchParams.get('sessionId') || ''
          if (!sid) {
            sendJson(res, 400, { error: 'sessionId required' })
            return
          }
          if (url.searchParams.get('stats') === '1') {
            sendJson(res, 200, poolStats(sid, live))
            return
          }
          const scope = url.searchParams.get('scope') || ''
          if (scope === 'live' || scope === 'archive' || scope === 'all') {
            sendJson(res, 200, { items: poolItems(sid, scope), sessionId: sid, scope })
            return
          }
          // opportunistic archive of expired entries (history replay path)
          archiveOldEntries(sid, live)
          const items = historyFor(sid, live, ctxTagsFrom(recentLines, triggers))
          sendJson(res, 200, { items, sessionId: sid })
        } catch (e) {
          sendJson(res, 500, { error: String(e && e.message ? e.message : e) })
        }
      },
    })

    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/pools',
      handler: async (_req, res) => {
        try {
          sendJson(res, 200, { sessions: listPools() })
        } catch (e) {
          sendJson(res, 500, { error: String(e && e.message ? e.message : e) })
        }
      },
    })

    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/pool/item',
      handler: async (req, res) => {
        try {
          if (req.method === 'PATCH') {
            const body = await readBody(req)
            const sid = body?.sessionId
            const id = body?.id
            if (!sid || !id) {
              sendJson(res, 400, { error: 'sessionId and id required' })
              return
            }
            sendJson(res, 200, patchPoolItem(sid, id, body || {}))
            return
          }
          if (req.method === 'DELETE') {
            const body = await readBody(req)
            const sid = body?.sessionId
            const id = body?.id
            if (!sid || !id) {
              sendJson(res, 400, { error: 'sessionId and id required' })
              return
            }
            sendJson(res, 200, deletePoolItem(sid, id, body?.scope))
            return
          }
          sendJson(res, 405, { error: 'method not allowed' })
        } catch (e) {
          sendJson(res, 500, { error: String(e && e.message ? e.message : e) })
        }
      },
    })

    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/pool/restore',
      handler: async (req, res) => {
        try {
          const body = await readBody(req)
          const sid = body?.sessionId
          const id = body?.id
          if (!sid || !id) {
            sendJson(res, 400, { error: 'sessionId and id required' })
            return
          }
          const result = restorePoolItem(sid, id, live.restoreMaxAgeHours)
          sendJson(res, result.ok ? 200 : result.reason === 'too_old' ? 403 : 404, result)
        } catch (e) {
          sendJson(res, 500, { error: String(e && e.message ? e.message : e) })
        }
      },
    })
    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/like',
      handler: async (req, res) => {
        try {
          const body = await readBody(req)
          const sid = body?.sessionId || currentSessionId
          const content = String(body?.content || '').slice(0, 48)
          if (!sid || !content) {
            sendJson(res, 400, { error: 'sessionId and content required' })
            return
          }
          const result = likeInPool(sid, content)
          sendJson(res, result.ok ? 200 : 400, result)
        } catch (e) {
          sendJson(res, 500, { error: String(e && e.message ? e.message : e) })
        }
      },
    })

    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/heat',
      handler: async (req, res) => {
        try {
          const url = new URL(req.url, 'http://127.0.0.1')
          const windowSec = Math.max(5, Number(url.searchParams.get('window') || 30))
          const cutoff = Date.now() - windowSec * 1000
          const recent = triggers.filter((t) => t.at >= cutoff)
          let score = 0
          for (const t of recent) {
            if (t.kind === 'tool_call') score += 1.5
            else if (t.kind === 'tool_error') score += 2.5
            else if (t.kind === 'user_message') score += 2
            else if (t.kind === 'reply_complete') score += 2
            else if (t.kind === 'task_done') score += 4
            else score += 0.5
          }
          // normalize roughly to 0..1
          const heat = Math.max(0, Math.min(1, score / 20))
          sendJson(res, 200, { heat, events: recent.length, windowSec, score })
        } catch (e) {
          sendJson(res, 500, { error: String(e && e.message ? e.message : e) })
        }
      },
    })
  }

  console.log('[dsh-danmaku] plugin loaded, pools at', poolDir())
}

export { Config, apply, inject, name }
