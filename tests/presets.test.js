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

test('dedupePresetLines 区分大小写', () => {
  const r = dedupePresetLines(['A'], ['a'])
  assert.deepEqual(r.add, ['a'])
})

test('dedupePresetLines 空入参', () => {
  assert.deepEqual(dedupePresetLines([], []), { add: [], dupExisting: 0, dupInFile: 0 })
})
