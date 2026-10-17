/** Built-in preset danmaku packs and pure sampling helpers. */

export const PRESET_PACKS = {
  general: [
    { content: '前方高能', tags: ['hype'] },
    { content: 'agent 开冲！', tags: ['hype'] },
    { content: '这波稳了', tags: ['cheer'] },
    { content: '在写了在写了', tags: ['work'] },
    { content: '好耶', tags: ['cheer'] },
    { content: '围观围观', tags: ['watch'] },
    { content: '有点东西', tags: ['praise'] },
    { content: '泪目', tags: ['emo'] },
    { content: '太强了吧', tags: ['praise'] },
    { content: '进度条：▓▓░░', tags: ['work'] },
    { content: '懂王上线', tags: ['fun'] },
    { content: '我直接一个好', tags: ['cheer'] },
    { content: '这操作可以', tags: ['praise'] },
    { content: '再快一点', tags: ['hype'] },
    { content: '稳住我们能赢', tags: ['cheer'] },
    { content: '有手就行（不是）', tags: ['fun'] },
    { content: '这就是实力吗', tags: ['praise'] },
    { content: '弹幕护体', tags: ['watch'] },
    { content: '建议直接上热门', tags: ['hype'] },
    { content: '爷青回', tags: ['emo'] },
  ],
  coding: [
    { content: '这个 if 有点东西', tags: ['code'] },
    { content: 'bug 再见', tags: ['code'] },
    { content: '编译通过！', tags: ['code'] },
    { content: '测试全绿', tags: ['test'] },
    { content: '重构狂喜', tags: ['code'] },
    { content: '类型体操大师', tags: ['code'] },
    { content: '注释好评', tags: ['code'] },
    { content: '这命名可以', tags: ['code'] },
    { content: '异步地狱爬出来了', tags: ['code'] },
    { content: '正则战士', tags: ['code'] },
    { content: '边界条件拿捏', tags: ['test'] },
    { content: '再写一版就完美', tags: ['work'] },
    { content: '代码评审通过', tags: ['review'] },
    { content: '并发好耶', tags: ['code'] },
    { content: '缓存命中', tags: ['perf'] },
    { content: '日志说清楚了', tags: ['debug'] },
    { content: '单测补上了', tags: ['test'] },
    { content: '文档齐全', tags: ['doc'] },
    { content: '依赖已锁定', tags: ['build'] },
    { content: '一次过', tags: ['praise'] },
  ],
  casual: [
    { content: '摸鱼围观中', tags: ['fun'] },
    { content: '泡面已就位', tags: ['fun'] },
    { content: '咖啡续命中', tags: ['fun'] },
    { content: '老板看不见我', tags: ['fun'] },
    { content: '午休快乐', tags: ['fun'] },
    { content: '今天也是元气满满', tags: ['cheer'] },
    { content: '卷起来了', tags: ['hype'] },
    { content: '躺平看 agent 干活', tags: ['fun'] },
    { content: '好耶，准时下班', tags: ['cheer'] },
    { content: '再来亿遍', tags: ['fun'] },
    { content: '绝绝子', tags: ['fun'] },
    { content: 'awsl', tags: ['emo'] },
    { content: '爷的青春回来了', tags: ['emo'] },
    { content: '有被笑到', tags: ['fun'] },
    { content: '建议循环播放', tags: ['fun'] },
  ],
}

export const EVENT_PRESET_TAG = {
  user_message: ['hype', 'watch', 'work'],
  reply_complete: ['praise', 'cheer', 'work'],
  tool_call: ['work', 'code', 'watch'],
  task_done: ['cheer', 'praise', 'hype'],
}

export const EVENT_BURST = {
  user_message: 3,
  reply_complete: 2,
  tool_call: 1,
  task_done: 4,
}

/** @returns {string[]} */
export function packNames() {
  return Object.keys(PRESET_PACKS)
}

/**
 * @param {string} pack
 * @param {string} event
 * @param {object} [opts]
 * @param {number} [opts.count]
 * @param {string[]} [opts.blockedWords]
 * @param {Map<string, number>} [opts.fatigue] content → session uses
 * @param {() => number} [opts.random]
 * @returns {{ content: string, tags: string[], source: 'preset' }[]}
 */
export function samplePresets(pack, event, opts = {}) {
  const random = opts.random || Math.random
  let packItems = PRESET_PACKS[pack] || PRESET_PACKS.general
  if (opts.lines && Array.isArray(opts.lines) && opts.lines.length) {
    packItems = opts.lines.map((c) => ({ content: String(c), tags: [] }))
  }
  const wantedTags = EVENT_PRESET_TAG[event] || []
  const blocked = (opts.blockedWords || []).map((w) => String(w).trim().toLowerCase()).filter(Boolean)
  const fatigue = opts.fatigue || new Map()

  const scored = packItems.map((item) => {
    const content = String(item.content || '')
    const lower = content.toLowerCase()
    if (blocked.some((w) => lower.includes(w))) return null
    const tagHit = wantedTags.length === 0 ? 0.4 : (item.tags || []).some((t) => wantedTags.includes(t)) ? 1 : 0.15
    const uses = fatigue.get(content) || 0
    const weight = tagHit / (1 + 0.5 * uses)
    return { item, content, weight }
  }).filter(Boolean)

  if (scored.length === 0) return []

  const count = Math.max(1, Math.min(opts.count ?? EVENT_BURST[event] ?? 2, scored.length))
  const picked = []
  const pool = scored.slice()
  for (let i = 0; i < count && pool.length > 0; i++) {
    const total = pool.reduce((s, x) => s + x.weight, 0)
    let r = random() * total
    let idx = 0
    for (let j = 0; j < pool.length; j++) {
      r -= pool[j].weight
      if (r <= 0) {
        idx = j
        break
      }
    }
    const chosen = pool.splice(idx, 1)[0]
    fatigue.set(chosen.content, (fatigue.get(chosen.content) || 0) + 1)
    picked.push({ content: chosen.content, tags: chosen.item.tags || [], source: 'preset' })
  }
  return picked
}

/** @param {string} content @param {string[]} blockedWords */
export function isBlocked(content, blockedWords) {
  const lower = String(content || '').toLowerCase()
  return (blockedWords || []).some((w) => {
    const word = String(w || '').trim().toLowerCase()
    return word && lower.includes(word)
  })
}

/** Weighted layout pick. @returns {'roll'|'top'|'bottom'} */
export function pickLayout(weights, random = Math.random) {
  const w = {
    roll: Number(weights?.roll ?? 80),
    top: Number(weights?.top ?? 10),
    bottom: Number(weights?.bottom ?? 10),
  }
  const total = w.roll + w.top + w.bottom
  if (total <= 0) return 'roll'
  let r = random() * total
  r -= w.roll
  if (r <= 0) return 'roll'
  r -= w.top
  if (r <= 0) return 'top'
  return 'bottom'
}

export function pickColor(uniform, color, colorWeights, random = Math.random) {
  if (uniform) return color || '#FFFFFF'
  const weights = colorWeights || [
    { color: '#FFFFFF', weight: 70 },
    { color: '#89D5FF', weight: 15 },
    { color: '#FFFF00', weight: 10 },
    { color: '#FB7299', weight: 5 },
  ]
  const total = weights.reduce((s, x) => s + Number(x.weight || 0), 0)
  if (total <= 0) return '#FFFFFF'
  let r = random() * total
  for (const x of weights) {
    r -= Number(x.weight || 0)
    if (r <= 0) return x.color || '#FFFFFF'
  }
  return weights[weights.length - 1].color || '#FFFFFF'
}

/**
 * 导入/编辑共用的行规整：去 BOM 与 C0/C1 控制符、内部换行与制表符折叠为单个空格、trim。
 * 不做任何长度过滤——预设包行没有长度上限（48 字符只作用于 LLM 生成路径）。
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizePresetLine(raw) {
  let s = String(raw ?? '').replace(/\uFEFF/g, '')
  // 换行 / 制表符 → 单个空格（D4）：文本视图按 \n 切行，不折叠会一条裂两条
  s = s.replace(/[\r\n\t\f\v\u0085\u2028\u2029]+/g, ' ')
  // C0 / C1 控制符删除（代理对不受影响，emoji 无碍）
  s = s.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
  return s.trim()
}

/**
 * Track collision check: can a new roll item enter this track?
 * @param {number} viewportW
 * @param {{ width: number, v: number, spawnAt: number } | null} last
 * @param {{ width: number, v: number }} next
 * @param {number} nowMs
 * @param {number} gapPx
 */
export function canEnterTrack(viewportW, last, next, nowMs, gapPx = 8) {
  if (!last) return true
  const elapsed = (nowMs - last.spawnAt) / 1000
  // last's left edge has moved: viewportW - last.v * elapsed
  // next enters at right edge; need last fully clear of next's spawn zone
  const lastLeft = viewportW - last.v * elapsed
  const needed = last.width + gapPx
  // Conservative: last left edge must be < viewportW - needed (so there's room for next width+gap)
  // More precisely: last's right edge (lastLeft + last.width) should be <= viewportW - next.width - gap
  // At spawn, next's right edge is at viewportW. last's left edge should be <= viewportW - last.width - gap - next.width + last.width
  // Simplified bilibili-style: gap time = (last.width + next.width + gap) / last.v
  const gapSec = (last.width + needed) / Math.max(last.v, 1)
  return elapsed >= gapSec - 0.05 || lastLeft + last.width <= viewportW - next.width - gapPx
}

/** 预设包行没有长度上限（D7）：超过此长度只计数，绝不丢弃或截断。 */
export const PRESET_LINE_SOFT_CHARS = 48

/** D10：JSON 对象取文本字段的优先级。 */
export const PRESET_JSON_TEXT_FIELDS = ['barrage', 'text', 'content', 'line', 'msg', 'message']

/** @returns {string[]} */
function splitTextLines(text) {
  return String(text ?? '').split(/\r\n|\r|\n/)
}

/** 小写扩展名（去掉 ?query / #hash），没有扩展名时返回 ''。 */
function extensionOf(filename) {
  const name = String(filename ?? '').toLowerCase().split(/[?#]/)[0]
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot + 1) : ''
}

/** 最小 XML 实体反转义（&amp; 最后处理，避免重复解码）。 */
function xmlUnescape(text) {
  return String(text ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#x0*27;/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

/** D10：从 JSON 对象里按优先级取文本；取不到返回 null。 */
function jsonTextFieldOf(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  for (const field of PRESET_JSON_TEXT_FIELDS) {
    const raw = value[field]
    if (typeof raw === 'string') return { field, value: raw }
  }
  return null
}

/**
 * RFC 4180 取每条记录的第一个字段（双引号包裹、"" 转义、CRLF、引号内换行均支持）。
 * 不抛异常：未闭合引号按「吃到文本末尾」处理。
 * @param {string} text
 * @param {string} delimiter
 * @returns {string[]}
 */
function csvFirstFields(text, delimiter) {
  const source = String(text ?? '')
  const n = source.length
  const fields = []
  let i = 0
  while (i < n) {
    let first = ''
    let firstDone = false
    let inQuotes = false
    for (;;) {
      if (i >= n) break
      const ch = source[i]
      if (inQuotes) {
        if (ch === '"') {
          if (source[i + 1] === '"') {
            first += '"'
            i += 2
            continue
          }
          inQuotes = false
          i += 1
          continue
        }
        first += ch
        i += 1
        continue
      }
      if (ch === '"' && first === '' && !firstDone) {
        inQuotes = true
        i += 1
        continue
      }
      if (ch === delimiter) {
        firstDone = true
        i += 1
        continue
      }
      if (ch === '\r' || ch === '\n') {
        if (ch === '\r' && source[i + 1] === '\n') i += 1
        i += 1
        break
      }
      if (!firstDone) first += ch
      i += 1
    }
    fields.push(first)
  }
  return fields
}

/** Bilibili 弹幕 XML：抽 <d p="...">text</d> 的文本并反转义。 */
function xmlDanmakuTexts(text) {
  const out = []
  const re = /<d\b[^>]*>([\s\S]*?)<\/d>/gi
  let m
  while ((m = re.exec(String(text ?? ''))) !== null) out.push(xmlUnescape(m[1]))
  return out
}

function errorText(err) {
  const msg = err && err.message ? String(err.message) : String(err)
  return msg.split('\n')[0].slice(0, 200)
}

/**
 * 按扩展名解析导入文本，逐项过 normalizePresetLine。
 * 唯一的丢弃条件是「规整后为空」（空串 / 纯空白）；单字弹幕如「6」保留（D7）。
 * 抽到 0 条时 detectedShape 里带可读原因，绝不静默成功（D9b）。
 * @param {string} text
 * @param {string} [filename]
 * @returns {{ entries: string[], detectedShape: string, stats: { parsed: number, droppedShort: number, overChars: number, failed: number }, ok: boolean, error: string | null }}
 */
export function parsePresetImport(text, filename) {
  // BOM 必须在分派前剥掉：CSV 首字段的引号识别与 JSON.parse 都会被前导 BOM 破坏
  // （Excel 导出的 csv/json 几乎都带 BOM）；行内残留 BOM 仍由 normalizePresetLine 兜底。
  const raw = String(text ?? '').replace(/^\uFEFF/, '')
  const ext = extensionOf(filename)
  const candidates = []
  let failed = 0
  let shape = ''

  if (ext === 'json') {
    let data
    try {
      data = JSON.parse(raw)
    } catch (err) {
      const reason = 'JSON 解析失败：' + errorText(err)
      return {
        entries: [],
        detectedShape: 'json:' + reason,
        stats: { parsed: 0, droppedShort: 0, overChars: 0, failed: 0 },
        ok: false,
        error: reason,
      }
    }
    if (typeof data === 'string') {
      candidates.push(data)
      shape = 'json:字符串根'
    } else if (Array.isArray(data)) {
      const fieldHits = new Map()
      let stringHits = 0
      for (const item of data) {
        if (typeof item === 'string') {
          candidates.push(item)
          stringHits += 1
          continue
        }
        const hit = jsonTextFieldOf(item)
        if (hit) {
          candidates.push(hit.value)
          fieldHits.set(hit.field, (fieldHits.get(hit.field) || 0) + 1)
          continue
        }
        failed += 1
      }
      const fields = [...fieldHits.entries()].map(([f, c]) => f + '×' + c).join('/')
      const parts = [stringHits ? 'string×' + stringHits : '', fields].filter(Boolean).join('/')
      shape = data.length === 0
        ? 'json:数组为空（0 项，无可导入条目）'
        : candidates.length === 0
          ? 'json:数组 ' + data.length + ' 项未提取到条目（元素既不是字符串，也没有 ' +
            PRESET_JSON_TEXT_FIELDS.join('/') + ' 字段）'
          : 'json:数组 ' + data.length + ' 项 → ' + parts
    } else {
      const hit = jsonTextFieldOf(data)
      if (hit) {
        candidates.push(hit.value)
        shape = 'json:对象字段 ' + hit.field
      } else {
        const keys = data && typeof data === 'object' ? Object.keys(data).slice(0, 8).join(',') : ''
        shape = 'json:未提取到条目（顶层是 ' + (data === null ? 'null' : typeof data) +
          (keys ? '，键：' + keys : '') + '；期望数组、字符串，或含 ' +
          PRESET_JSON_TEXT_FIELDS.join('/') + ' 字段的对象）'
      }
    }
  } else if (ext === 'jsonl' || ext === 'ndjson') {
    const lines = splitTextLines(raw)
    let badLines = 0
    let mapped = 0
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      let value
      try {
        value = JSON.parse(trimmed)
      } catch {
        badLines += 1
        failed += 1
        continue
      }
      if (typeof value === 'string') {
        candidates.push(value)
        mapped += 1
        continue
      }
      const hit = jsonTextFieldOf(value)
      if (hit) {
        candidates.push(hit.value)
        mapped += 1
        continue
      }
      failed += 1
    }
    shape = candidates.length
      ? 'jsonl:' + mapped + ' 行（共 ' + lines.length + ' 行' + (badLines ? '，解析失败 ' + badLines + ' 行' : '') + '）'
      : 'jsonl:未提取到条目（读取 ' + lines.length + ' 行，解析失败 ' + badLines + ' 行，其余无 ' +
        PRESET_JSON_TEXT_FIELDS.join('/') + ' 字段）'
  } else if (ext === 'csv' || ext === 'tsv') {
    const delimiter = ext === 'tsv' ? '\t' : ','
    const records = csvFirstFields(raw, delimiter)
    for (const field of records) candidates.push(field)
    shape = records.length
      ? ext + ':首列 ' + records.length + ' 条记录'
      : ext + ':未提取到记录（输入 ' + raw.length + ' 字符）'
  } else if (ext === 'xml') {
    const texts = xmlDanmakuTexts(raw)
    for (const t of texts) candidates.push(t)
    shape = texts.length
      ? 'xml:<d> 弹幕 ' + texts.length + ' 条'
      : 'xml:未提取到弹幕（未找到 <d> 节点，输入 ' + raw.length + ' 字符）'
  } else {
    const lines = splitTextLines(raw)
    for (const line of lines) candidates.push(line)
    shape = 'text:逐行 ' + lines.length + ' 行（' + (ext || '无扩展名') + '）'
  }

  const entries = []
  let droppedShort = 0
  let overChars = 0
  for (const candidate of candidates) {
    const line = normalizePresetLine(candidate)
    if (!line) {
      droppedShort += 1
      continue
    }
    if (line.length > PRESET_LINE_SOFT_CHARS) overChars += 1
    entries.push(line)
  }

  const stats = { parsed: candidates.length, droppedShort, overChars, failed }
  let detectedShape = shape
  let error = null
  if (entries.length === 0) {
    error = detectedShape
    if (!/未提取|为空|失败/.test(detectedShape)) {
      detectedShape += ' → 0 条可用条目（' + (droppedShort ? '全部为空行/纯空白 ' + droppedShort + ' 条' : '无内容') + '）'
      error = detectedShape
    }
  }
  return { entries, detectedShape, stats, ok: entries.length > 0, error }
}

/** D5 去重口径：trim → NFC 归一 → 精确比较（区分大小写）。 */
function dedupeKey(value) {
  return String(value ?? '').trim().normalize('NFC')
}

/**
 * 把 incoming 相对 existing 与批内去重：两者都按 D5 归一后精确比较。
 * 不做长度过滤（唯一丢弃发生在 parsePresetImport 里）。
 * @param {string[]} existing 当前草稿该包已有的行
 * @param {string[]} incoming 本次导入解析出的行
 * @returns {{ add: string[], dupExisting: number, dupInFile: number }} add 保持 incoming 顺序
 */
export function dedupePresetLines(existing, incoming) {
  const have = new Set()
  for (const line of existing || []) have.add(dedupeKey(line))
  const add = []
  const seenInFile = new Set()
  let dupExisting = 0
  let dupInFile = 0
  for (const line of incoming || []) {
    const key = dedupeKey(line)
    if (have.has(key)) {
      dupExisting += 1
      continue
    }
    if (seenInFile.has(key)) {
      dupInFile += 1
      continue
    }
    seenInFile.add(key)
    add.push(key)
  }
  return { add, dupExisting, dupInFile }
}
