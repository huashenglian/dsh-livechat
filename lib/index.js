// dsh-danmaku — Host half.
// Registers the `danmaku` settings namespace, observes session events into a
// trigger ring buffer, serves config/trigger/LLM HTTP routes for the client
// half, and (optionally) generates danmaku via a configured LLM.

import { samplePresets, isBlocked, PRESET_PACKS } from './presets.js'
import {
  loadEmojiManifest,
  clearEmojiCache,
  listLibrary,
  createFolder,
  deleteFolder,
  renameFolder,
  moveItems,
  deleteItems,
  setItemWeight,
  clearAllEmoji,
  addImageBuffer,
  imagePath,
  startGitImport,
  startZipBufferImport,
  abortImport,
  getImportStatus,
  toPublicItem,
} from './emoji-lib.js'
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync, renameSync, appendFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

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
  layoutWeights: { roll: 80, top: 10, bottom: 10, reverse: 0 },
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
  llmModel: '-',
  llmBurstCount: 5,
  density: 3,
  ambientMinMs: 500,
  ambientMaxMs: 1400,
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
  // Interval backoff (silence heartbeat)
  backoffEnabled: true,
  backoffBaseSec: 12,
  backoffMaxSec: 60,
  backoffFactor: 1.5,
  backoffResetSec: 6,
  thinkingAsActive: true,
  warningAlwaysWake: true,
  thinkingExcerptChars: 240,
  // Which data the LLM prompt may read
  contextSources: {
    conversation: true,
    thinking: true,
    warning: true,
    usage: true,
    tools: true,
    events: true,
  },
  // Display extras
  uniformColor: false,
  emojiEnabled: false,
  emojiBaseSize: 48,
  emojiTotalProb: 0.15,
  advancedEnabled: false,
  advancedStyles: [
    { id: 'as_std', name: '常规增强', weight: 3, rotate: 0, scale: 1.05, bold: false, opacity: 1, font: '', durationMs: 4000, mode: 'scroll' },
    { id: 'as_tilt', name: '轻微倾斜', weight: 1, rotate: -6, scale: 1, bold: false, opacity: 0.95, font: '', durationMs: 4000, mode: 'scroll' },
    { id: 'as_big', name: '大号强调', weight: 1, rotate: 0, scale: 1.35, bold: true, opacity: 1, font: '', durationMs: 4000, mode: 'scroll' },
    { id: 'as_rev', name: '逆向滚动', weight: 1, rotate: 0, scale: 1, bold: false, opacity: 1, font: '', durationMs: 4000, mode: 'reverse' },
  ],
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
  debugLogs: false,
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
    reverse: clampNum(lw.reverse, 0, 100, 0),
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
  out.llmBurstCount = Math.floor(clampNum(out.llmBurstCount, 1, 20, DEFAULTS.llmBurstCount))
  out.density = clampNum(out.density, 1, 5, DEFAULTS.density)
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
    ? out.wakeupEvents.filter((e) => ['user_message', 'reply_complete', 'tool_call', 'task_done', 'tool_error', 'warning'].includes(e))
    : [...DEFAULTS.wakeupEvents]
  out.smartMinGapSec = clampNum(out.smartMinGapSec, 3, 60, DEFAULTS.smartMinGapSec)
  out.intervalOnlyWhenActive = out.intervalOnlyWhenActive !== false
  out.backoffEnabled = out.backoffEnabled !== false
  out.backoffBaseSec = clampNum(out.backoffBaseSec, 5, 120, DEFAULTS.backoffBaseSec)
  out.backoffMaxSec = clampNum(out.backoffMaxSec, out.backoffBaseSec, 300, DEFAULTS.backoffMaxSec)
  out.backoffFactor = clampNum(out.backoffFactor, 1.1, 3, DEFAULTS.backoffFactor)
  out.backoffResetSec = clampNum(out.backoffResetSec, 2, 60, DEFAULTS.backoffResetSec)
  out.thinkingAsActive = out.thinkingAsActive !== false
  out.warningAlwaysWake = out.warningAlwaysWake !== false
  out.thinkingExcerptChars = Math.floor(clampNum(out.thinkingExcerptChars, 80, 480, DEFAULTS.thinkingExcerptChars))
  out.contextSources = { ...DEFAULTS.contextSources }
  if (raw.contextSources && typeof raw.contextSources === 'object') {
    for (const k of Object.keys(DEFAULTS.contextSources)) {
      if (raw.contextSources[k] !== undefined) out.contextSources[k] = !!raw.contextSources[k]
    }
  }
  if (!['all', 'whitelist', 'blacklist'].includes(out.toolcallFilterMode)) out.toolcallFilterMode = 'all'
  out.toolcallTools = Array.isArray(out.toolcallTools) ? out.toolcallTools.map(String).filter(Boolean) : []
  out.toolcallOnErrorExtra = out.toolcallOnErrorExtra !== false
  out.globalMinGapSec = clampNum(out.globalMinGapSec, 1, 60, DEFAULTS.globalMinGapSec)
  out.uniformColor = out.uniformColor === true
  out.emojiEnabled = out.emojiEnabled === true
  out.emojiBaseSize = Math.floor(clampNum(out.emojiBaseSize, 16, 128, DEFAULTS.emojiBaseSize))
  out.emojiTotalProb = clampNum(out.emojiTotalProb, 0, 0.5, DEFAULTS.emojiTotalProb)
  out.advancedEnabled = out.advancedEnabled === true
  const styles = Array.isArray(raw && raw.advancedStyles) ? raw.advancedStyles : DEFAULTS.advancedStyles
  out.advancedStyles = styles.slice(0, 24).map((s, i) => {
    const m = s && s.mode
    const mode = (m === 'rain' || m === 'pop' || m === 'reverse') ? m : 'scroll'
    return {
      id: String((s && s.id) || 'as_' + i),
      name: String((s && s.name) || '样式' + (i + 1)).slice(0, 20),
      weight: clampNum(s && s.weight, 0, 100, 1),
      rotate: clampNum(s && s.rotate, -30, 30, 0),
      scale: clampNum(s && s.scale, 0.8, 1.6, 1),
      bold: !!(s && s.bold),
      opacity: clampNum(s && s.opacity, 0.3, 1, 1),
      font: String((s && s.font) || '').slice(0, 60),
      durationMs: Math.floor(clampNum(s && s.durationMs, 1000, 8000, 4000)),
      mode,
    }
  })
  if (!out.advancedStyles.length) out.advancedStyles = cloneDefaults().advancedStyles
  out.layoutWeights.reverse = 0
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
  out.debugLogs = out.debugLogs === true
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
  // Prefer assistant visible reply body; also accept reasoning snippets as text.
  if (type === 'assistant/chunk') {
    const chunk = data.chunk || data
    if (chunk && chunk.type === 'text-delta' && typeof chunk.text === 'string') {
      return chunk.text
    }
    if (chunk && chunk.type === 'reasoning-delta' && typeof chunk.text === 'string') {
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

/** Pull reasoning/thinking delta text (empty for visible reply text). */
function extractThinkingText(event) {
  const type = event && event.type
  const data = event?.data || {}
  if (type === 'assistant/chunk') {
    const chunk = data.chunk || data
    if (chunk && chunk.type === 'reasoning-delta' && typeof chunk.text === 'string') {
      return chunk.text
    }
    return ''
  }
  if (type === 'assistant/attempt' || type === 'assistant/message') {
    const msg = data.message || data
    const stream = data.stream || msg?.stream
    if (Array.isArray(stream)) {
      const texts = []
      for (const rec of stream) {
        if (!rec || typeof rec !== 'object') continue
        if (Array.isArray(rec.texts)) {
          for (const t of rec.texts) if (typeof t === 'string' && t.trim()) texts.push(t)
        } else if (typeof rec.text === 'string' && rec.type === 'reasoning-delta') {
          texts.push(rec.text)
        }
      }
      if (texts.length) return texts.join('')
    }
    const blocks = msg && msg.content
    if (Array.isArray(blocks)) {
      return blocks
        .filter((b) => b && b.type === 'reasoning')
        .map((b) => b.text || '')
        .join(' ')
    }
  }
  return ''
}

const WARN_HINT = /(已达到|上限|截断|失败|错误|警告|超时|timeout|error|failed|truncat|max.?token)/i

function looksLikeWarning(text) {
  const s = String(text || '').trim()
  if (!s) return false
  if (s.length > 240) return false
  return WARN_HINT.test(s)
}

function fmtTok(n) {
  const v = Number(n) || 0
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (v >= 1000) return (v / 1000).toFixed(1) + 'K'
  return String(Math.round(v))
}

function findUsageIn(obj, depth) {
  if (!obj || typeof obj !== 'object' || depth > 4) return null
  if (obj.inputTokens != null || obj.outputTokens != null || obj.prompt_tokens != null) return obj
  if (obj.usage && typeof obj.usage === 'object') {
    const u = obj.usage
    if (u.inputTokens != null || u.outputTokens != null || u.prompt_tokens != null) return u
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const hit = findUsageIn(v, depth + 1)
      if (hit) return hit
    }
  }
  return null
}

/** Compact usage summary for LLM prompt (API/token stats bar). */
function formatUsageSummary(u) {
  if (!u) return ''
  const input = Number(u.inputTokens ?? u.prompt_tokens) || 0
  const output = Number(u.outputTokens ?? u.completion_tokens) || 0
  const cacheRead = Number(u.cacheReadTokens ?? u.cache_read_input_tokens ?? u.prompt_cache_hit_tokens) || 0
  const cacheWrite = Number(u.cacheWriteTokens ?? u.cache_creation_input_tokens ?? 0)
  const billedIn = input + cacheRead + cacheWrite
  const hitPct = billedIn > 0 ? ((cacheRead / billedIn) * 100).toFixed(0) : null
  const parts = []
  parts.push(`输入 ${fmtTok(billedIn)}Tok · 输出 ${fmtTok(output)}Tok`)
  if (hitPct != null) parts.push(`缓存命中 ${hitPct}%`)
  if (cacheWrite) parts.push(`缓存写 ${fmtTok(cacheWrite)}`)
  return parts.join(' · ')
}

function extractUsageFromEvent(event) {
  const type = event && event.type
  if (!type) return null
  const data = event?.data || {}
  // Direct usage on turn/step or assistant/message
  let u = findUsageIn(data, 0)
  if (u) return u
  const stream = data.stream || data.message?.stream
  if (Array.isArray(stream)) {
    for (const rec of stream) {
      if (!rec || typeof rec !== 'object') continue
      if (rec.type === 'usage' && rec.usage) return rec.usage
      if (rec.usage && (rec.usage.inputTokens != null || rec.usage.outputTokens != null)) return rec.usage
    }
  }
  return null
}

function mapEventType(event) {
  const type = event && event.type
  if (!type) return null
  if (type === 'user/message' || type === 'user/message-notice') {
    const text = extractEventText(event)
    const data = event?.data || {}
    const src = data.message?.source || data.source
    const isNotice = src && src.form === 'notice'
    if (isNotice && looksLikeWarning(text)) return 'warning'
    return 'user_message'
  }
  if (type === 'turn/end' || type === 'turn/complete') {
    const reason = event?.data?.reason || event?.data?.endReason
    if (reason === 'max-tokens' || reason === 'error' || reason === 'failed') return 'warning'
    return 'reply_complete'
  }
  if (type === 'tool/result') {
    const data = event.data || {}
    if (data.ok === false || data.error) return 'tool_error'
    return 'tool_call'
  }
  if (type === 'tool/call') return 'tool_call'
  if (type === 'task/done' || type === 'goal/completed') return 'task_done'
  if (type === 'assistant/message') return 'reply_complete'
  // Long thinking streams only reasoning-delta — treat as soft activity.
  if (type === 'assistant/chunk') {
    const chunk = event?.data?.chunk || event?.data || {}
    if (chunk.type === 'reasoning-delta') return 'thinking'
    return null
  }
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

/** True when a model id is configured for LLM generation. '-' means off. */
function isLlmModelUsable(model) {
  const m = String(model == null ? '' : model).trim()
  return m !== '' && m !== '-' && m !== '—'
}

/** Whether this event should trigger LLM generation under current wakeupType. */
function shouldLlmWake(kind, meta, cfg) {
  if (!cfg.llmEnabled) return false
  if (!isLlmModelUsable(cfg.llmModel)) return false
  // Warnings (max-tokens / errors) always wake so the crowd reacts.
  if (kind === 'warning') return cfg.warningAlwaysWake !== false
  if (kind === 'tool_error') {
    return cfg.toolcallOnErrorExtra !== false && (cfg.wakeupType === 'toolcall' || cfg.wakeupType === 'smart')
  }
  // Long thinking: soft activity only — client interval heartbeat still runs,
  // and generate() embeds a short thinking excerpt in the prompt.
  if (kind === 'thinking') return false
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

function buildLlmPrompt(cfg, recent, events, extras) {
  const style = cfg.stylePrompt
  const n = cfg.llmBurstCount
  const src = cfg.contextSources || DEFAULTS.contextSources
  const lines = []
  lines.push('你是围观 AI 编程 agent 工作的弹幕观众集合。请生成简短、有趣、有围观氛围的中文弹幕。')
  lines.push(`风格：${style}`)
  lines.push(`条数：恰好 ${n} 条；每条不超过 ${cfg.styleMaxChars || 24} 个字符。`)
  lines.push('禁止：剧透后续步骤、泄露密钥或路径隐私、与当前上下文无关的内容。')
  if (src.events !== false && events && events.length) lines.push(`最近事件：${events.slice(-5).join('；')}`)
  if (src.conversation !== false && recent && recent.length) {
    lines.push(`最近对话摘要：\n${recent.slice(-6).map((r) => `- ${r}`).join('\n')}`)
  }
  if (src.tools !== false && extras && extras.tools) {
    lines.push(`最近工具：${String(extras.tools).slice(0, 120)}`)
  }
  if (src.thinking !== false && extras && extras.thinking) {
    lines.push(`agent 最近思考片段（仅作氛围参考，勿照抄）：\n${String(extras.thinking).slice(0, cfg.thinkingExcerptChars || 240)}`)
  }
  if (src.usage !== false && extras && extras.usage) {
    lines.push(`最近 API/Token 统计：${extras.usage}`)
  }
  if (src.warning !== false && extras && extras.warning) {
    lines.push(`系统/警告提示：${String(extras.warning).slice(0, 120)}`)
  }
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

async function collectLlmText(ctx, modelId, messages, debugLogs) {
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
  if (debugLogs) {
    console.log('[dsh-danmaku] llm call provider=', provider, 'model=', model, 'known=', providerIds.join(','))
  }

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
      if (chunk.kind === 'error' && debugLogs) {
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

function presetsPath() {
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  return join(home, 'danmaku-presets.json')
}

function emojiDir() {
  // kept for log line; real store lives in emoji-lib
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  return join(home, 'danmaku-emojis')
}

function emojiManifestPath() {
  return join(emojiDir(), 'manifest.json')
}

function defaultPresetStore() {
  const packs = {}
  const order = []
  for (const id of Object.keys(PRESET_PACKS)) {
    const arr = PRESET_PACKS[id]
    packs[id] = {
      name: id === 'general' ? '通用' : id === 'coding' ? '编程' : id === 'casual' ? '闲聊' : id,
      lines: arr.map((x) => (typeof x === 'string' ? x : String(x && x.content))).filter(Boolean),
    }
    order.push(id)
  }
  return { packs, order }
}

function loadPresetStore() {
  try {
    if (existsSync(presetsPath())) {
      const raw = JSON.parse(readFileSync(presetsPath(), 'utf8'))
      if (raw && raw.packs && typeof raw.packs === 'object') {
        const order = Array.isArray(raw.order) && raw.order.length
          ? raw.order.filter((id) => raw.packs[id])
          : Object.keys(raw.packs)
        return { packs: raw.packs, order }
      }
    }
  } catch {
    /* fall through */
  }
  return defaultPresetStore()
}

function savePresetStore(store) {
  try {
    const home = process.env.DSH_HOME || join(homedir(), '.dsh')
    mkdirSync(home, { recursive: true })
    writeFileSync(presetsPath(), JSON.stringify(store, null, 2), 'utf8')
    return true
  } catch {
    return false
  }
}

function getPackLines(packId, store) {
  const s = store || loadPresetStore()
  const p = s.packs && s.packs[packId]
  if (p && Array.isArray(p.lines) && p.lines.length) return p.lines.map(String).filter(Boolean)
  const built = PRESET_PACKS[packId] || PRESET_PACKS.general
  return built.map((x) => (typeof x === 'string' ? x : String(x && x.content))).filter(Boolean)
}

function clearPresetStore() {
  try {
    if (existsSync(presetsPath())) unlinkSync(presetsPath())
  } catch {
    /* ignore */
  }
}

function pickEmojiItem(manifest, random) {
  const rnd = random || Math.random
  const items = (manifest && manifest.items) || []
  const live = items.filter((x) => x && x.file && Number(x.weight) > 0)
  if (!live.length) return null
  let total = 0
  for (const x of live) total += Number(x.weight) || 0
  if (total <= 0) return null
  let r = rnd() * total
  for (const x of live) {
    r -= Number(x.weight) || 0
    if (r <= 0) return x
  }
  return live[live.length - 1]
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

/** Delete every live + archive pool file (all sessions). */
function clearAllPools() {
  let removed = 0
  try {
    for (const f of listPoolFiles()) {
      try {
        unlinkSync(join(poolDir(), f))
        removed++
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const ad = archiveDir()
    if (existsSync(ad)) {
      for (const f of readdirSync(ad).filter((x) => x.endsWith('.jsonl'))) {
        try {
          unlinkSync(join(ad, f))
          removed++
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
  return { ok: true, removed }
}

/** True when this plugin package is still on disk (false after uninstall). */
function pluginPackageStillInstalled() {
  try {
    const selfDir = dirname(fileURLToPath(import.meta.url))
    return existsSync(join(selfDir, '..', 'package.json'))
  } catch {
    return true
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
  const thinkingBuf = []
  const toolsBuf = []
  let lastWarningText = ''
  let lastUsageSummary = ''
  let lastThinkingTriggerAt = 0
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

  const pushThinking = (text) => {
    const line = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 160)
    if (!line) return
    thinkingBuf.push(line)
    // Keep only a short tail — one snippet, not the full CoT.
    if (thinkingBuf.length > 8) thinkingBuf.splice(0, thinkingBuf.length - 8)
  }

  const thinkingExcerpt = () => {
    const max = live.thinkingExcerptChars || 240
    return thinkingBuf.slice(-3).join(' ').slice(0, max)
  }

  const pushTool = (name) => {
    const n = String(name || '').trim().slice(0, 40)
    if (!n) return
    if (toolsBuf[toolsBuf.length - 1] === n) return
    toolsBuf.push(n)
    if (toolsBuf.length > 8) toolsBuf.splice(0, toolsBuf.length - 8)
  }

  const toolsExcerpt = () => toolsBuf.slice(-5).join(', ')

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
      const type = event && event.type
      // Thinking excerpt is separate from visible reply text.
      const thinking = extractThinkingText(event)
      if (thinking) pushThinking(thinking)
      // Usage / API stats (token bar) for LLM context
      const usage = extractUsageFromEvent(event)
      if (usage) lastUsageSummary = formatUsageSummary(usage)
      const text = extractEventText(event)
      if (text && kind !== 'thinking') pushRecent(text)
      const data = event?.data || {}
      const toolName = data.name || data.toolName || data.tool
      if (toolName && (type === 'tool/call' || type === 'tool/result')) pushTool(toolName)
      if (!kind) return
      if (kind === 'warning') {
        const warn =
          (text && looksLikeWarning(text) && text.slice(0, 160)) ||
          (type === 'turn/end' && (data.reason || data.endReason) === 'max-tokens'
            ? '已达到输出 token 上限，回答被截断'
            : '') ||
          '警告'
        lastWarningText = warn
      }
      // Throttle thinking triggers so a long CoT does not spam the poller.
      let emit = true
      if (kind === 'thinking') {
        const now = Date.now()
        if (now - lastThinkingTriggerAt < 2500) emit = false
        else lastThinkingTriggerAt = now
      }
      if (emit) {
        pushTrigger(kind, {
          sessionId: sid,
          tool: toolName,
          ok: data.ok !== false && !data.error,
          preview: (kind === 'thinking' ? thinkingExcerpt() : text).slice(0, 80),
          warning: kind === 'warning' ? lastWarningText : undefined,
          usage: lastUsageSummary || undefined,
        })
      }
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

  // Plugin unload/uninstall: if the package was removed, wipe pool cache too.
  ctx.on('dispose', () => {
    try {
      if (!pluginPackageStillInstalled()) {
        const r = clearAllPools()
        clearEmojiCache()
        clearPresetStore()
        console.log('[dsh-livechat] uninstall cleanup, removed', r.removed, 'pool files + emoji/preset cache')
      }
    } catch {
      /* ignore */
    }
  })

  ensurePoolDir()

  // ---- HTTP routes (kind: exact, one handler per path) ----
  const webServer = ctx.get('webServer')
  if (webServer) {
    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/health',
      handler: async (_req, res) => {
        sendJson(res, 200, { ok: true, name, version: '0.4.2' })
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

          if (!live.llmEnabled || !isLlmModelUsable(live.llmModel)) {
            const items = samplePresets(live.presetPack, event, {
              count: live.llmBurstCount,
              blockedWords: live.blockedWords,
              lines: getPackLines(live.presetPack),
            })
            if (sid) appendPool(sid, items, live.maxPoolEntries)
            return sendJson(res, 200, {
              items,
              source: 'preset',
              reason: !live.llmEnabled ? 'llm-disabled' : 'llm-no-model',
            })
          }

          if (now - lastLlmAt < Math.max(1000, (live.globalMinGapSec || 5) * 1000) && lastLlmItems.length) {
            return sendJson(res, 200, { items: lastLlmItems, source: 'ai', reason: 'throttled' })
          }

          const prompt = buildLlmPrompt(
            live,
            recentLines,
            triggers.slice(-6).map((t) => t.kind),
            {
              thinking: thinkingExcerpt(),
              warning: lastWarningText,
              usage: lastUsageSummary,
              tools: toolsExcerpt(),
            },
          )
          let items = []
          try {
            const text = await collectLlmText(ctx, live.llmModel, makeMessages(
              '你只输出 JSON 数组，不要输出其他文字。',
              prompt,
            ), live.debugLogs)
            if (live.debugLogs) {
              console.log('[dsh-danmaku] llm raw=', JSON.stringify(text.slice(0, 200)), 'model=', live.llmModel)
            }
            items = parseLlmJson(text)
              .filter((c) => !isBlocked(c, live.blockedWords))
              .slice(0, live.llmBurstCount)
              .map((content) => ({
                content,
                source: 'ai',
                tags: ctxTagsFrom(recentLines, triggers),
              }))
          } catch (e) {
            if (live.debugLogs) {
              console.warn('[dsh-danmaku] llm failed:', e && e.message)
            }
            items = []
          }

          if (items.length === 0) {
            items = samplePresets(live.presetPack, event, {
              count: live.llmBurstCount,
              blockedWords: live.blockedWords,
              lines: getPackLines(live.presetPack),
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
            lines: getPackLines(live.presetPack),
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
      path: '/api/danmaku/pools/clear',
      handler: async (req, res) => {
        try {
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: 'POST required' })
            return
          }
          sendJson(res, 200, clearAllPools())
        } catch (e) {
          sendJson(res, 500, { error: String(e && e.message ? e.message : e) })
        }
      },
    })

    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/presets',
      handler: async (req, res) => {
        try {
          if (req.method === 'GET') {
            sendJson(res, 200, loadPresetStore())
            return
          }
          if (req.method === 'PUT' || req.method === 'POST') {
            const body = await readBody(req)
            const next = body && body.packs ? body : body && body.store ? body.store : null
            if (!next || !next.packs || typeof next.packs !== 'object') {
              sendJson(res, 400, { error: 'body.packs required' })
              return
            }
            const order = Array.isArray(next.order) && next.order.length
              ? next.order.filter((id) => next.packs[id])
              : Object.keys(next.packs)
            const store = { packs: next.packs, order }
            savePresetStore(store)
            sendJson(res, 200, store)
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
      path: '/api/danmaku/emojis',
      handler: async (req, res) => {
        try {
          if (req.method === 'GET') {
            sendJson(res, 200, listLibrary())
            return
          }
          if (req.method === 'PATCH' || req.method === 'POST') {
            const body = await readBody(req)
            const action = body && body.action
            if (action === 'delete' && body.id) {
              sendJson(res, 200, deleteItems([body.id]))
              return
            }
            if (action === 'deleteMany' && Array.isArray(body.ids)) {
              sendJson(res, 200, deleteItems(body.ids))
              return
            }
            if (action === 'weight' && body.id) {
              const r = setItemWeight(body.id, body.weight)
              sendJson(res, r.ok ? 200 : 404, r)
              return
            }
            if (action === 'folderCreate') {
              sendJson(res, 200, { ok: true, folder: createFolder(body.name, body.parentId) })
              return
            }
            if (action === 'folderRename' && body.id) {
              sendJson(res, 200, renameFolder(body.id, body.name))
              return
            }
            if (action === 'folderDelete' && body.id) {
              sendJson(res, 200, deleteFolder(body.id, !!body.force))
              return
            }
            if (action === 'move') {
              sendJson(res, 200, moveItems(body.ids, body.folderId))
              return
            }
            if (action === 'clearAll') {
              sendJson(res, 200, clearAllEmoji())
              return
            }
            sendJson(res, 400, { error: 'unknown action' })
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
      path: '/api/danmaku/emojis/upload',
      handler: async (req, res) => {
        try {
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: 'POST required' })
            return
          }
          const body = await readBody(req)
          // ZIP bulk upload
          if (body && body.kind === 'zip' && body.dataBase64) {
            const buf = Buffer.from(String(body.dataBase64), 'base64')
            const job = await startZipBufferImport({
              buffer: buf,
              folderId: body.folderId || null,
              limit: Number(body.limit) || 0,
              name: body.name,
            })
            sendJson(res, 200, job)
            return
          }
          const dataUrl = String(body?.dataUrl || '')
          const name = String(body?.name || 'emoji').slice(0, 40)
          const weight = Math.max(0, Number(body?.weight) || 1)
          const m = dataUrl.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/i)
          if (!m) {
            sendJson(res, 400, { error: 'dataUrl must be data:image/...;base64,...' })
            return
          }
          const ext = m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase()
          const item = addImageBuffer({
            name,
            buffer: Buffer.from(m[2], 'base64'),
            folderId: body?.folderId || null,
            weight,
            ext,
          })
          if (!item) {
            sendJson(res, 400, { error: 'write failed' })
            return
          }
          sendJson(res, 200, { ok: true, item })
        } catch (e) {
          sendJson(res, 500, { error: String(e && e.message ? e.message : e) })
        }
      },
    })

    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/emojis/import',
      handler: async (req, res) => {
        try {
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: 'POST required' })
            return
          }
          const body = await readBody(req)
          if (body && body.action === 'abort') {
            abortImport()
            sendJson(res, 200, { ok: true, status: getImportStatus() })
            return
          }
          const kind = body && body.kind
          if (kind === 'git') {
            // fire-and-forget streaming; client polls status
            startGitImport({
              url: body.url,
              folderId: body.folderId || null,
              limit: Number(body.limit) || 0,
            }).catch(() => {})
            sendJson(res, 200, { ok: true, started: true })
            return
          }
          sendJson(res, 400, { error: 'kind must be git' })
        } catch (e) {
          sendJson(res, 500, { error: String(e && e.message ? e.message : e) })
        }
      },
    })

    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/emojis/import/status',
      handler: async (_req, res) => {
        try {
          sendJson(res, 200, getImportStatus())
        } catch (e) {
          sendJson(res, 500, { error: String(e && e.message ? e.message : e) })
        }
      },
    })

    webServer.register({
      kind: 'exact',
      path: '/api/danmaku/emojis/image',
      handler: async (req, res) => {
        try {
          const url = new URL(req.url, 'http://127.0.0.1')
          const id = url.searchParams.get('id') || ''
          const p = imagePath(id)
          if (!p) {
            res.writeHead(404)
            res.end('not found')
            return
          }
          const buf = readFileSync(p)
          const ext = (p.split('.').pop() || 'png').toLowerCase()
          const type = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
            : ext === 'gif' ? 'image/gif'
            : ext === 'webp' ? 'image/webp'
            : 'image/png'
          res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' })
          res.end(buf)
        } catch (e) {
          res.writeHead(500)
          res.end(String(e && e.message ? e.message : e))
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
            else if (t.kind === 'warning') score += 3
            else if (t.kind === 'thinking') score += 0.3
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

  console.log('[dsh-livechat] plugin loaded, pools at', poolDir())
}

export { Config, apply, inject, name }
