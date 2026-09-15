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
