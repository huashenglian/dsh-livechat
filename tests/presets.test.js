import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  samplePresets,
  isBlocked,
  pickLayout,
  pickColor,
  canEnterTrack,
  PRESET_PACKS,
  packNames,
  normalizePresetLine,
  parsePresetImport,
  dedupePresetLines,
} from '../lib/presets.js'

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')

test('packNames lists built-in packs', () => {
  const names = packNames()
  assert.ok(names.includes('general'))
  assert.ok(names.includes('coding'))
  assert.ok(names.includes('casual'))
})

test('samplePresets returns requested count and respects blocked words', () => {
  const fatigue = new Map()
  const items = samplePresets('general', 'user_message', {
    count: 3,
    blockedWords: ['前方高能'],
    fatigue,
    random: () => 0.01,
  })
  assert.equal(items.length, 3)
  for (const it of items) {
    assert.notEqual(it.content, '前方高能')
    assert.equal(it.source, 'preset')
  }
})

test('samplePresets fatigue reduces repeats', () => {
  const fatigue = new Map()
  const first = samplePresets('coding', 'tool_call', { count: 5, fatigue, random: () => 0 })
  assert.ok(first.length >= 1)
  // force same pack many times; fatigue map should grow
  for (let i = 0; i < 10; i++) {
    samplePresets('coding', 'tool_call', { count: 3, fatigue, random: () => 0.5 })
  }
  assert.ok(fatigue.size > 0)
})

test('isBlocked matches substring case-insensitively', () => {
  assert.equal(isBlocked('这是前方高能', ['前方']), true)
  assert.equal(isBlocked('HELLO', ['hello']), true)
  assert.equal(isBlocked('ok', ['x']), false)
  assert.equal(isBlocked('ok', ['']), false)
})

test('pickLayout respects weights', () => {
  assert.equal(pickLayout({ roll: 100, top: 0, bottom: 0 }, () => 0.5), 'roll')
  assert.equal(pickLayout({ roll: 0, top: 100, bottom: 0 }, () => 0.5), 'top')
  assert.equal(pickLayout({ roll: 0, top: 0, bottom: 100 }, () => 0.5), 'bottom')
})

test('pickColor uniform and weighted', () => {
  assert.equal(pickColor(true, '#FF0000'), '#FF0000')
  const c = pickColor(false, '#FFFFFF', [
    { color: '#AAA', weight: 0 },
    { color: '#BBB', weight: 100 },
  ], () => 0.5)
  assert.equal(c, '#BBB')
})

test('canEnterTrack allows empty and enforces gap', () => {
  const now = 10_000
  assert.equal(canEnterTrack(800, null, { width: 100, v: 100 }, now, 8), true)
  const last = { width: 200, v: 100, spawnAt: now }
  // Immediately after spawn: should not enter same track
  assert.equal(canEnterTrack(800, last, { width: 100, v: 100 }, now + 10, 8), false)
  // After enough time for last to clear
  const gapSec = (200 + 200 + 8) / 100
  assert.equal(canEnterTrack(800, last, { width: 100, v: 100 }, now + gapSec * 1000 + 50, 8), true)
})

test('preset packs are non-empty', () => {
  for (const [name, list] of Object.entries(PRESET_PACKS)) {
    assert.ok(Array.isArray(list) && list.length >= 10, name)
  }
})

// ---------- 任务 1：normalizePresetLine ----------

test('normalizePresetLine 去 BOM、折叠 CRLF 与制表符、trim', () => {
  assert.equal(normalizePresetLine('\uFEFFa\r\nb\tc '), 'a b c')
})

test('normalizePresetLine 保留单字弹幕「6」，不做长度过滤', () => {
  assert.equal(normalizePresetLine('6'), '6')
  assert.equal(normalizePresetLine('顶'), '顶')
})

test('normalizePresetLine 保留 emoji 代理对', () => {
  assert.equal(normalizePresetLine('😀 emoji 🐏'), '😀 emoji 🐏')
  assert.equal(normalizePresetLine('😀').length, 2)
})

test('normalizePresetLine 删除 C0/C1 控制符', () => {
  assert.equal(normalizePresetLine('a\u0000b\u0007c\u009Fd'), 'abcd')
})

test('normalizePresetLine 折叠连续换行为单个空格，不碰普通空格', () => {
  assert.equal(normalizePresetLine('a\n\nb'), 'a b')
  assert.equal(normalizePresetLine('  a  b  '), 'a  b')
})

test('normalizePresetLine 空输入返回空串', () => {
  assert.equal(normalizePresetLine(''), '')
  assert.equal(normalizePresetLine(null), '')
  assert.equal(normalizePresetLine(undefined), '')
})

// ---------- 任务 2：parsePresetImport ----------

test('parsePresetImport .txt：空行/纯空白丢弃，单字保留', () => {
  const r = parsePresetImport(fixture('basic.txt'), 'basic.txt')
  assert.deepEqual(r.entries, ['前方高能', '测试弹幕', '6', '顶'])
  assert.equal(r.stats.droppedShort, 3)
  assert.equal(r.stats.overChars, 0)
  assert.equal(r.ok, true)
})

test('parsePresetImport BOM + CRLF + 制表符', () => {
  const r = parsePresetImport(fixture('bom-crlf.txt'), 'bom-crlf.txt')
  assert.deepEqual(r.entries, ['a', 'b c', 'd'])
})

// fixture 字节会被 core.autocrlf 归一（blob 里是 LF），CRLF 契约改由字面量断言保证，
// 这样在任何 checkout 字节下都真的在测 CRLF，而不是测「恰好能通过」的 LF。
test('parsePresetImport 字面 CRLF / 孤立 CR / BOM（不依赖 fixture 字节）', () => {
  assert.deepEqual(parsePresetImport('﻿a\r\nb\r\n', 'x.txt').entries, ['a', 'b'])
  assert.deepEqual(parsePresetImport('a\rb\r', 'x.txt').entries, ['a', 'b'])
  assert.deepEqual(parsePresetImport('﻿"a,b"\r\n"c""d"\r\n', 'x.csv').entries, ['a,b', 'c"d'])
})

test('parsePresetImport .csv：首列', () => {
  const r = parsePresetImport(fixture('plain.csv'), 'plain.csv')
  assert.deepEqual(r.entries, ['aaa', 'bbb', 'ccc'])
  assert.match(r.detectedShape, /csv/)
})

test('parsePresetImport .csv：引号内逗号、"" 转义、CRLF、引号内换行折叠', () => {
  const r = parsePresetImport(fixture('quoted.csv'), 'quoted.csv')
  assert.deepEqual(r.entries, ['a,b', 'say "hi"', 'plain', 'multi line'])
})

test('parsePresetImport .csv：未闭合引号不抛异常', () => {
  const r = parsePresetImport('"unclosed,x\ny', 'x.csv')
  assert.deepEqual(r.entries, ['unclosed,x y'])
})

test('parsePresetImport .tsv：首列', () => {
  const r = parsePresetImport(fixture('mixed.tsv'), 'mixed.tsv')
  assert.deepEqual(r.entries, ['甲', '乙', '丙'])
  assert.match(r.detectedShape, /tsv/)
})

test('parsePresetImport .json：裸字符串数组', () => {
  const r = parsePresetImport(fixture('list.json'), 'list.json')
  assert.deepEqual(r.entries, ['第一条', '第二条', '6'])
  assert.match(r.detectedShape, /string×3/)
})

test('parsePresetImport .json：对象数组按 D10 字段优先级取值', () => {
  const r = parsePresetImport(fixture('objects.json'), 'objects.json')
  assert.deepEqual(r.entries, ['高优先', '次优先', '三优先', '四优先', '五优先', '六优先'])
  assert.equal(r.stats.failed, 1)
  assert.match(r.detectedShape, /barrage×1/)
})

test('parsePresetImport .json：字符串根', () => {
  const r = parsePresetImport('"单条弹幕"', 'x.json')
  assert.deepEqual(r.entries, ['单条弹幕'])
})

test('parsePresetImport .json：条目内换行折叠为空格', () => {
  const r = parsePresetImport(JSON.stringify([{ barrage: 'a\nb\tc' }]), 'x.json')
  assert.deepEqual(r.entries, ['a b c'])
})

test('parsePresetImport .jsonl：字符串、对象、空行与坏行', () => {
  const r = parsePresetImport(fixture('lines.jsonl'), 'lines.jsonl')
  assert.deepEqual(r.entries, ['jsonl 一', 'jsonl 二'])
  assert.equal(r.stats.failed, 2)
  assert.match(r.detectedShape, /解析失败 1 行/)
})

test('parsePresetImport .ndjson 与 .jsonl 同口径', () => {
  const r = parsePresetImport('"a"\n{"text":"b"}\n', 'x.ndjson')
  assert.deepEqual(r.entries, ['a', 'b'])
})

test('parsePresetImport .xml：<d> 文本 + 实体反转义', () => {
  const r = parsePresetImport(fixture('danmaku.xml'), 'danmaku.xml')
  assert.deepEqual(r.entries, ['测试 & 弹幕', '<尖括号> "引号" \'单引号\''])
  assert.match(r.detectedShape, /<d>/)
})

test('parsePresetImport .xml：无 <d> 节点时给出可读原因（D9b）', () => {
  const r = parsePresetImport('<i><chatserver>local</chatserver></i>', 'x.xml')
  assert.deepEqual(r.entries, [])
  assert.equal(r.ok, false)
  assert.match(r.detectedShape, /未提取到弹幕/)
})

test('parsePresetImport .xml：未闭合 <d> 100KB 线性完成且 0 条（防 O(n²) 卡死）', () => {
  // 旧写法 /<d\b[^>]*>([\s\S]*?)<\/d>/gi 对未闭合 <d> 是 O(n²)：100KB 实测 4.4s。
  const big = '<i><d p="1,1,25,16777215">' + 'a'.repeat(100 * 1024) + '</i>'
  const t0 = Date.now()
  const r = parsePresetImport(big, 'big.xml')
  const elapsed = Date.now() - t0
  assert.deepEqual(r.entries, [])
  assert.equal(r.ok, false)
  assert.ok(elapsed < 1500, 'unclosed <d> 100KB took ' + elapsed + 'ms (expected < 1500ms)')
})

test('parsePresetImport .xml：嵌套 <d> 不跨元素误匹配', () => {
  // 旧写法会从第一个 <d> 一路吞到最后一个 </d>，抓出 "a<d>b"。
  const r = parsePresetImport('<d>a<d>b</d>', 'x.xml')
  assert.deepEqual(r.entries, ['b'])
})

test('parsePresetImport .xml：多个正常 <d> 全部解析', () => {
  const r = parsePresetImport(
    '<i><d p="1">一</d><d p="2">二 &amp; 三</d><d p="3">四</d></i>',
    'x.xml'
  )
  assert.deepEqual(r.entries, ['一', '二 & 三', '四'])
})

test('parsePresetImport JSON 解析失败不抛异常且带原因（D9b）', () => {
  const r = parsePresetImport('{not json', 'x.json')
  assert.deepEqual(r.entries, [])
  assert.equal(r.ok, false)
  assert.match(r.detectedShape, /JSON 解析失败/)
})

test('parsePresetImport YouTube 形状 JSON：0 条且有可读原因（D9b）', () => {
  const r = parsePresetImport(fixture('youtube-like.json'), 'live_chat.json')
  assert.deepEqual(r.entries, [])
  assert.equal(r.ok, false)
  assert.match(r.detectedShape, /未提取到条目/)
})

test('parsePresetImport 空文本：0 条且有可读原因', () => {
  const r = parsePresetImport('', 'x.txt')
  assert.deepEqual(r.entries, [])
  assert.match(r.detectedShape, /0 条可用条目/)
})

test('parsePresetImport 超 48 字符只计数不丢弃、不截断（D7）', () => {
  const long = '长'.repeat(60)
  const r = parsePresetImport(long + '\n短', 'x.txt')
  assert.deepEqual(r.entries, [long, '短'])
  assert.equal(r.stats.overChars, 1)
})

test('parsePresetImport 未知扩展名按行切分', () => {
  const r = parsePresetImport('a\nb\n', 'x.unknown')
  assert.deepEqual(r.entries, ['a', 'b'])
})

// ---------- 任务 3：dedupePresetLines ----------

test('dedupePresetLines 验收例：与既有去重 + 批内去重', () => {
  assert.deepEqual(dedupePresetLines(['a'], ['a', 'b', 'b']), {
    add: ['b'],
    dupExisting: 1,
    dupInFile: 1,
  })
})

test('dedupePresetLines 保持 incoming 顺序', () => {
  const r = dedupePresetLines(['a'], ['c', 'b', 'a', 'b'])
  assert.deepEqual(r.add, ['c', 'b'])
  assert.equal(r.dupExisting, 1)
  assert.equal(r.dupInFile, 1)
})

test('dedupePresetLines trim + NFC：ñ 两种拼法判同', () => {
  const r = dedupePresetLines([' ñ '.normalize('NFC')], ['n\u0303'])
  assert.deepEqual(r.add, [])
  assert.equal(r.dupExisting, 1)
})

test('dedupePresetLines 既有行先规整：存量的 "a\\nb" 与导入的 "a b" 判同', () => {
  assert.deepEqual(dedupePresetLines(['a\nb'], ['a b']), {
    add: [],
    dupExisting: 1,
    dupInFile: 0,
  })
})

test('dedupePresetLines 区分大小写', () => {
  const r = dedupePresetLines(['A'], ['a'])
  assert.deepEqual(r.add, ['a'])
})

test('dedupePresetLines 空入参', () => {
  assert.deepEqual(dedupePresetLines([], []), { add: [], dupExisting: 0, dupInFile: 0 })
})

// 0.6.12 fix: presetPack is a user-defined id space. The server used to reset any
// id that was not a built-in back to 'general' inside clampConfig, which silently
// rewrote a selected CUSTOM pack on every config save — the 预设包 dropdown snapped
// back to the first pack and the sampler kept serving 通用 lines even after the user
// deleted every built-in pack. Only a missing/empty id falls back.
test('clampConfig 保留自定义 presetPack（不再被钳回 general）', async () => {
  const { clampConfig } = await import('../lib/index.js')
  assert.equal(clampConfig({ presetPack: 'pack_mkz1x2' }).presetPack, 'pack_mkz1x2')
  assert.equal(clampConfig({ presetPack: 'general' }).presetPack, 'general')
  assert.equal(clampConfig({ presetPack: 'coding' }).presetPack, 'coding')
  assert.equal(clampConfig({ presetPack: '' }).presetPack, 'general')
  assert.equal(clampConfig({ presetPack: null }).presetPack, 'general')
  assert.equal(clampConfig({}).presetPack, 'general')
  // 保存一轮只改 presetPack 的合并（settings modal onSave 的 POST 形状）不得改动其它键
  const merged = clampConfig({ presetPack: 'pack_x', density: 3 })
  assert.equal(merged.presetPack, 'pack_x')
  assert.equal(merged.density, 3)
  // 未被提供的键仍取宿主默认值（DEFAULTS.fontSize = 16），证明这是合并而非替换
  assert.equal(merged.fontSize, 16)
})

// 0.6.13: one line's hard ceiling lived as a literal 48 in five independent
// pool/parse paths (appendPool, likeInPool, patchPoolItem, POST /like, LLM
// output parsing), so long text was silently cut on its way into a session pool
// AND `styleMaxChars` could never be raised above 48. One constant now.
test('clipContent 只按 200 字截断（48 字不再被截断）', async () => {
  const { clipContent, MAX_CONTENT_CHARS } = await import('../lib/index.js')
  assert.equal(MAX_CONTENT_CHARS, 200)
  const s48 = '甲'.repeat(48)
  assert.equal(clipContent(s48), s48, '48-char line must pass through untouched')
  assert.equal(clipContent('乙'.repeat(200)).length, 200)
  assert.equal(clipContent('丙'.repeat(201)).length, 200)
  assert.equal(clipContent(null), '')
  assert.equal(clipContent(undefined), '')
})

test('clampConfig styleMaxChars（LLM 弹幕字数上限）上限为 200（0.6.13）', async () => {
  const { clampConfig } = await import('../lib/index.js')
  assert.equal(clampConfig({ styleMaxChars: 120 }).styleMaxChars, 120)
  assert.equal(clampConfig({ styleMaxChars: 200 }).styleMaxChars, 200)
  assert.equal(clampConfig({ styleMaxChars: 201 }).styleMaxChars, 200)
  assert.equal(clampConfig({ styleMaxChars: 999 }).styleMaxChars, 200)
  assert.equal(clampConfig({ styleMaxChars: 4 }).styleMaxChars, 8)
})

// 0.6.13 follow-up: styleMaxChars was never the cap — it is prompt text asking
// the LLM for short lines and clips nothing. The real per-line cap is now a
// setting (`contentMaxChars`, 8..2000, default 200) threaded into every
// clipping path, so raising it actually lengthens danmaku.
test('contentMaxChars 真实硬上限：clamp 8..2000、clipContent 按传入上限截断（0.6.13）', async () => {
  const { clampConfig, clipContent, contentCap, CONTENT_MAX_CHARS_LIMIT } = await import('../lib/index.js')
  assert.equal(CONTENT_MAX_CHARS_LIMIT, 2000)
  assert.equal(clampConfig({}).contentMaxChars, 200, 'default when absent')
  assert.equal(clampConfig({ contentMaxChars: 500 }).contentMaxChars, 500)
  assert.equal(clampConfig({ contentMaxChars: 2000 }).contentMaxChars, 2000)
  assert.equal(clampConfig({ contentMaxChars: 5000 }).contentMaxChars, 2000)
  assert.equal(clampConfig({ contentMaxChars: 4 }).contentMaxChars, 8)
  // The configured cap — not the 200 default — is what clipContent applies.
  assert.equal(clipContent('甲'.repeat(300), 250).length, 250)
  assert.equal(clipContent('乙'.repeat(300)).length, 200, 'no limit → default 200')
  assert.equal(contentCap(undefined), 200)
  assert.equal(contentCap('nope'), 200)
  assert.equal(contentCap(150), 150)
})

// client.js is a browser bundle (window.__ModuleLoader__.load), so node cannot
// import it. Guard the three wiring points behind the 0.6.12 complaint that the
// 文本/列表 choice "reset on every pack switch and again after a restart":
// a static assertion is the cheapest real regression net for this file.
test('client 预设视图：记住用户选择并持久化（0.6.13）', () => {
  const src = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(src, /PRESET_VIEW_KEY\s*=\s*'dsh-danmaku-preset-view'/)
  assert.match(src, /localStorage\.setItem\(PRESET_VIEW_KEY,\s*v\)/)
  // Pack switch must resolve the stored preference — never re-derive per pack.
  assert.match(src, /React\.useEffect\(function \(\) \{\s*setView\(resolveViewFor\(/)
  assert.doesNotMatch(src, /setView\(defaultViewFor\(/)
  // Only an explicit toggle writes the preference.
  assert.match(src, /function switchView\(next\) \{[^}]*writePresetView\(next\)/)
})

// 0.6.13 follow-up: `styleMaxChars` only asks the LLM for short lines
// (prompt-level, clips nothing), so its row belongs in the LLM section. The
// REAL per-line cap is `contentMaxChars` — that row lives in 基础 and is
// mirrored into the floating quick panel. Same static-assertion net as above:
// client.js is a browser bundle node cannot import.
test('client 字数上限：contentMaxChars 在基础分区+悬浮窗，styleMaxChars 回 LLM 分区（0.6.13）', () => {
  const src = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  const basicsAt = src.indexOf("'data-sec': 'basics'")
  const nextSecAt = src.indexOf("'data-sec': '", basicsAt + 1)
  const capRowAt = src.indexOf("row('contentMaxChars'")
  assert.ok(basicsAt > -1 && nextSecAt > basicsAt && capRowAt > -1, 'anchor missing in client.js')
  // Inside the basics section = after its header, before the next section header.
  assert.ok(capRowAt > basicsAt && capRowAt < nextSecAt, "row('contentMaxChars') 应在基础分区内")
  // styleMaxChars (prompt-level) is back in the LLM section, after 基础.
  const styleRowAt = src.indexOf("row('styleMaxChars'")
  assert.ok(styleRowAt > nextSecAt, "row('styleMaxChars') 应在 LLM 分区（基础之后）")
  // Floating quick panel mirror, persisting through patchLive.
  assert.match(src, /patchLive\(\{ contentMaxChars: v \}\)/)
  assert.doesNotMatch(src, /patchLive\(\{ styleMaxChars: v \}\)/)
})

// 0.6.12 fix: getPackLines used to fall through to PRESET_PACKS.general for any
// missing id, so the sampler served 通用 lines even after the user deleted every
// built-in pack. The fallback now only applies to id-matched built-ins; deleted
// packs and the general-after-delete case return []. This is the server-side half
// of "删掉所有默认包后选新建包不再刷出默认弹幕".
test('samplePresets 不再回退到 PRESET_PACKS.general', () => {
  // 删除所有内置包后 sampler 不应继续吐出 通用 条目
  const r = samplePresets('general', 'user_message', { count: 5, lines: [] })
  assert.deepEqual(r, [], 'expected empty after every built-in deleted; got ' + JSON.stringify(r))
  // 自定义包传 lines 时只从这里抽
  const r2 = samplePresets('pack_x', 'user_message', { count: 5, lines: ['A', 'B', 'C'] })
  assert.equal(r2.length, 3)
  assert.ok(r2.every((x) => ['A', 'B', 'C'].includes(x.content)))
  // 完全没传 lines 且 id 是内置时仍可工作（首次安装/seed）
  const r3 = samplePresets('general', 'user_message', { count: 2 })
  assert.equal(r3.length, 2)
  assert.ok(r3.every((x) => PRESET_PACKS.general.some((y) => (typeof y === 'string' ? y : y.content) === x.content)))
})

test('getPackLines 自定义包优先于硬编码 general 兜底', async () => {
  const { getPackLines } = await import('../lib/index.js')
  // 1) 自定义包即便与 general 撞名也以包内行为准
  const custom = { packs: { pack_x: { name: 'X', lines: ['hello', 'world'] }, order: ['pack_x'] } }
  const r1 = getPackLines('pack_x', custom)
  assert.deepEqual(r1, ['hello', 'world'])
  // 2) 用户把 general 从持久化里删掉后，getPackLines('general', store) 不再回退
  //    到硬编码的 PRESET_PACKS.general（这是「即使删了所有默认包仍刷默认弹幕」的根因）
  //    关键：store 里没有 'general' 这个 key，才能命中新逻辑的「兜底只对 id 命中生效」
  const noGeneral = { packs: { coding: { name: '编程', lines: ['1+1=2'] }, order: ['coding'] } }
  assert.deepEqual(getPackLines('general', noGeneral), [])
  // 3) 完全找不到的 id 也返回 [] 而非 general
  assert.deepEqual(getPackLines('pack_nope', noGeneral), [])
})
