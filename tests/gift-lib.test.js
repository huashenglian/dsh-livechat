import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  giftDir,
  giftFilesDir,
  loadGiftManifest,
  saveGiftManifest,
  createFolder,
  renameFolder,
  deleteFolder,
  moveItems,
  deleteItems,
  setWeight,
  addAsset,
  clearAll,
  ensureSeed,
  toPublicItem,
  kindForExt,
  uid,
  sanitizeSvg,
  SVG_MAX_BYTES,
  clampGiftConfig,
  renderGiftTip,
  GIFT_TIP_MAX,
  GIFT_DEFAULTS,
  GIFT_POSITIONS,
  pickSender,
  parseSenderBatch,
  formatSenderBatch,
  GIFT_ANONYMOUS_SENDER,
  GIFT_SENDERS_MAX,
  GIFT_SENDER_NAME_MAX,
  mapCatalogGift,
  GIFT_CATALOG_FIELDS,
} from '../lib/gift-lib.js'

// Isolated temp "DSH_HOME" per test — never touches the real ~/.dsh.
function tmpHome() {
  const home = mkdtempSync(join(tmpdir(), 'dsh-gift-test-'))
  return home
}

function cleanup(home) {
  try {
    rmSync(home, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
}

const buf = (s) => Buffer.from(s, 'binary')

test('uid returns prefixed unique-ish ids', () => {
  const a = uid('g_')
  const b = uid('g_')
  assert.match(a, /^g_/)
  assert.notEqual(a, b)
})

test('kindForExt maps whitelist extensions to kinds', () => {
  assert.equal(kindForExt('.svg'), 'svg')
  assert.equal(kindForExt('.SVGA'), 'svga')
  assert.equal(kindForExt('gif'), 'image')
  assert.equal(kindForExt('.webp'), 'image')
  assert.equal(kindForExt('apng'), 'image')
  assert.equal(kindForExt('.png'), 'image')
  assert.equal(kindForExt('.jpg'), 'image')
  assert.equal(kindForExt('.exe'), null)
  assert.equal(kindForExt(''), null)
})

test('createFolder persists a folder and returns public shape', () => {
  const home = tmpHome()
  try {
    const f = createFolder('特效', null, home)
    assert.ok(f.id.startsWith('f_'))
    assert.equal(f.name, '特效')
    assert.equal(f.parentId, null)
    const m = loadGiftManifest(home)
    assert.equal(m.folders.length, 1)
    assert.equal(m.folders[0].id, f.id)
  } finally {
    cleanup(home)
  }
})

test('renameFolder updates name, missing folder returns not_found', () => {
  const home = tmpHome()
  try {
    const f = createFolder('old', null, home)
    const r = renameFolder(f.id, 'new', home)
    assert.equal(r.ok, true)
    assert.equal(r.folder.name, 'new')
    assert.equal(renameFolder('nope', 'x', home).ok, false)
    assert.equal(renameFolder('nope', 'x', home).reason, 'not_found')
  } finally {
    cleanup(home)
  }
})

test('deleteFolder refuses non-empty without force, force removes nested items+files', () => {
  const home = tmpHome()
  try {
    const parent = createFolder('parent', null, home)
    const child = createFolder('child', parent.id, home)
    const it = addAsset({ name: 'a.svg', buffer: buf('<svg/>'), folderId: child.id, home })
    assert.ok(it)
    const file = loadGiftManifest(home).items[0].file
    const refused = deleteFolder(parent.id, false, home)
    assert.equal(refused.ok, false)
    assert.equal(refused.reason, 'not_empty')
    assert.ok(loadGiftManifest(home).folders.length >= 2)

    const forced = deleteFolder(parent.id, true, home)
    assert.equal(forced.ok, true)
    const m = loadGiftManifest(home)
    assert.equal(m.folders.length, 0)
    assert.equal(m.items.length, 0)
    assert.equal(existsSync(join(giftFilesDir(home), file)), false)
  } finally {
    cleanup(home)
  }
})

test('moveItems reassigns folderId and ignores unknown ids', () => {
  const home = tmpHome()
  try {
    const a = addAsset({ name: 'a.svg', buffer: buf('<svg/>'), home })
    const f = createFolder('dest', null, home)
    const r = moveItems([a.id, 'ghost'], f.id, home)
    assert.equal(r.ok, true)
    assert.equal(r.moved, 1)
    assert.equal(loadGiftManifest(home).items[0].folderId, f.id)
  } finally {
    cleanup(home)
  }
})

test('deleteItems removes records and disk files', () => {
  const home = tmpHome()
  try {
    const a = addAsset({ name: 'a.svg', buffer: buf('<svg/>'), home })
    addAsset({ name: 'b.png', buffer: buf('\x89PNG\x00\x01'), home })
    const files = loadGiftManifest(home).items
    const fileA = files.find((x) => x.id === a.id).file
    const fileB = files.find((x) => x.id !== a.id).file
    const r = deleteItems([a.id], home)
    assert.equal(r.removed, 1)
    assert.equal(existsSync(join(giftFilesDir(home), fileA)), false)
    assert.equal(existsSync(join(giftFilesDir(home), fileB)), true)
    assert.equal(loadGiftManifest(home).items.length, 1)
  } finally {
    cleanup(home)
  }
})

test('setWeight sets value and clamps negatives to zero', () => {
  const home = tmpHome()
  try {
    const a = addAsset({ name: 'a.svg', buffer: buf('<svg/>'), home })
    assert.equal(setWeight(a.id, 5, home).weight, 5)
    assert.equal(setWeight(a.id, -3, home).weight, 0)
    assert.equal(setWeight('ghost', 1, home).ok, false)
  } finally {
    cleanup(home)
  }
})

test('addAsset writes bytes, records kind/bytes/source/createdAt', () => {
  const home = tmpHome()
  try {
    const data = buf('<svg width="1"></svg>')
    const it = addAsset({ name: 'star.svg', buffer: data, weight: 2, home })
    assert.ok(it)
    assert.equal(it.kind, 'svg')
    assert.equal(it.bytes, data.length)
    assert.equal(it.weight, 2)
    const m = loadGiftManifest(home)
    assert.equal(m.version, 1)
    assert.equal(m.items[0].source, 'user')
    assert.ok(typeof m.items[0].createdAt === 'number')
    assert.deepEqual(readFileSync(join(giftFilesDir(home), m.items[0].file)), data)
    // binary-safe round trip
    addAsset({ name: 'x.png', buffer: buf('\x00\x01\x02\xff'), home })
    const m2 = loadGiftManifest(home)
    const png = m2.items.find((x) => x.kind === 'image')
    assert.deepEqual(readFileSync(join(giftFilesDir(home), png.file)), buf('\x00\x01\x02\xff'))
  } finally {
    cleanup(home)
  }
})

test('addAsset rejects unknown extension with zero residue (no rewrite)', () => {
  const home = tmpHome()
  try {
    const r = addAsset({ name: 'evil.exe', buffer: buf('MZ'), home })
    assert.equal(r, null)
    assert.equal(loadGiftManifest(home).items.length, 0)
    const files = existsSync(giftFilesDir(home)) ? readdirSync(giftFilesDir(home)) : []
    assert.equal(files.length, 0)
  } finally {
    cleanup(home)
  }
})

test('addAsset rejects empty buffer', () => {
  const home = tmpHome()
  try {
    assert.equal(addAsset({ name: 'a.svg', buffer: Buffer.alloc(0), home }), null)
    assert.equal(loadGiftManifest(home).items.length, 0)
  } finally {
    cleanup(home)
  }
})

test('saveGiftManifest is atomic: no tmp residue, valid JSON', () => {
  const home = tmpHome()
  try {
    saveGiftManifest({ version: 1, folders: [], items: [] }, home)
    saveGiftManifest({ version: 1, folders: [], items: [] }, home)
    const leftovers = readdirSync(giftDir(home)).filter((n) => n.includes('.tmp-'))
    assert.equal(leftovers.length, 0)
    const parsed = JSON.parse(readFileSync(join(giftDir(home), 'manifest.json'), 'utf8'))
    assert.equal(parsed.version, 1)
  } finally {
    cleanup(home)
  }
})

test('loadGiftManifest on malformed JSON returns empty manifest (no throw)', () => {
  const home = tmpHome()
  try {
    mkdirSync(giftDir(home), { recursive: true })
    writeFileSync(join(giftDir(home), 'manifest.json'), '{ not json', 'utf8')
    const m = loadGiftManifest(home)
    assert.deepEqual(m, { version: 1, folders: [], items: [] })
  } finally {
    cleanup(home)
  }
})

test('ensureSeed seeds whitelist files only when manifest is missing', () => {
  const home = tmpHome()
  const src = mkdtempSync(join(tmpdir(), 'dsh-gift-seed-'))
  try {
    writeFileSync(join(src, 'star.svg'), '<svg id="s"/>', 'utf8')
    writeFileSync(join(src, 'blob.png'), buf('\x89PNG\x00\x01\x02'))
    writeFileSync(join(src, 'LICENSE-NOTES.md'), 'license text', 'utf8')
    const r = ensureSeed({ sourceDir: src, home })
    assert.equal(r.ok, true)
    assert.equal(r.seeded, 2)
    const m = loadGiftManifest(home)
    assert.equal(m.items.length, 2)
    assert.ok(m.items.every((x) => x.source === 'builtin'))
    assert.ok(m.items.every((x) => existsSync(join(giftFilesDir(home), x.file))))
    const names = m.items.map((x) => x.name).sort()
    assert.deepEqual(names, ['blob.png', 'star.svg'])
    // svg bytes copied faithfully
    const svg = m.items.find((x) => x.kind === 'svg')
    assert.equal(readFileSync(join(giftFilesDir(home), svg.file), 'utf8'), '<svg id="s"/>')
  } finally {
    cleanup(home)
    cleanup(src)
  }
})

test('ensureSeed does NOT reseed when manifest exists even if files/ is empty', () => {
  const home = tmpHome()
  const src = mkdtempSync(join(tmpdir(), 'dsh-gift-seed-'))
  try {
    writeFileSync(join(src, 'star.svg'), '<svg id="s"/>', 'utf8')
    assert.equal(ensureSeed({ sourceDir: src, home }).seeded, 1)
    clearAll(home)
    assert.equal(loadGiftManifest(home).items.length, 0)
    // manifest still present -> gate holds, no resurrection
    const again = ensureSeed({ sourceDir: src, home })
    assert.equal(again.seeded, 0)
    assert.equal(again.skipped, 'exists')
    assert.equal(loadGiftManifest(home).items.length, 0)
  } finally {
    cleanup(home)
    cleanup(src)
  }
})

test('ensureSeed silently skips when source dir is missing', () => {
  const home = tmpHome()
  try {
    const r = ensureSeed({ sourceDir: join(home, 'does-not-exist'), home })
    assert.equal(r.ok, true)
    assert.equal(r.seeded, 0)
    assert.equal(r.skipped, 'no_source')
    assert.equal(loadGiftManifest(home).items.length, 0)
  } finally {
    cleanup(home)
  }
})

test('clearAll wipes files but keeps an empty manifest (prevents seed resurrection)', () => {
  const home = tmpHome()
  try {
    addAsset({ name: 'a.svg', buffer: buf('<svg/>'), home })
    clearAll(home)
    const m = loadGiftManifest(home)
    assert.equal(m.items.length, 0)
    assert.equal(m.folders.length, 0)
    assert.equal(existsSync(join(giftDir(home), 'manifest.json')), true)
    assert.equal(readdirSync(giftFilesDir(home)).length, 0)
  } finally {
    cleanup(home)
  }
})

test('toPublicItem exposes the public shape', () => {
  const it = {
    id: 'g_1',
    name: 'star',
    kind: 'svg',
    file: 'g_1.svg',
    bytes: 12,
    weight: 3,
    folderId: null,
    source: 'builtin',
    createdAt: 123,
  }
  const p = toPublicItem(it)
  assert.equal(p.id, 'g_1')
  assert.equal(p.kind, 'svg')
  assert.equal(p.weight, 3)
  assert.equal(p.folderId, null)
  assert.equal(p.url, '/api/danmaku/gift/file?id=g_1')
})

// ---------------- sanitizeSvg (whitelist sanitizer) ----------------
// Structural danger scan — looks at tag/attr boundaries, not one literal.
function assertNoDanger(svg) {
  assert.doesNotMatch(svg, /<\s*script\b/i, 'script start tag')
  assert.doesNotMatch(svg, /<\s*\/\s*script\b/i, 'script end tag')
  assert.doesNotMatch(svg, /<\s*foreignobject\b/i, 'foreignObject')
  assert.doesNotMatch(svg, /<\s*(iframe|embed|object)\b/i, 'embedded frame/object')
  assert.doesNotMatch(svg, /\son[a-z]+\s*=/i, 'on* event attribute')
  assert.doesNotMatch(svg, /javascript\s*:/i, 'javascript: URL')
  assert.doesNotMatch(svg, /@import/i, 'CSS @import')
  assert.doesNotMatch(svg, /url\s*\(\s*['"]?\s*(https?:)?\/\//i, 'external url()')
}

const MALICIOUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)in" width="10">
  <script>alert('xss')</script>
  <foreignObject><div>html</div></foreignObject>
  <a xlink:href="javascript:alert(2)">click</a>
  <use href="http://evil.example/x.svg#a"/>
  <style>@import url("http://evil.example/a.css"); .x{background:url(https://evil.example/b.png)} .y{fill:url(#grad)} .z{fill:url(data:image/png;base64,AAA)}</style>
  <rect width="1" height="1" style="fill:url(http://evil.example/c.png)" OnClick="alert(3)"/>
  <animate attributeName="x" dur="1s"/>
</svg>`

test('sanitizeSvg strips <script> element AND its content', () => {
  const r = sanitizeSvg('<svg><script>alert(1)</script><rect/></svg>')
  assert.equal(r.ok, true)
  assert.doesNotMatch(r.svg, /<\s*script\b/i)
  assert.doesNotMatch(r.svg, /<\s*\/\s*script\b/i)
  assert.equal(r.svg.includes('alert(1)'), false)
  assert.match(r.svg, /<rect\/?>/i)
})

test('sanitizeSvg strips all on* attrs incl case + namespace variants', () => {
  const r = sanitizeSvg(
    '<svg><rect onload="a" ONLOAD="b" OnClick="c" onmouseover="d" onload="e" xlink:onload="f" xml:onclick="g"/></svg>'
  )
  assert.equal(r.ok, true)
  assertNoDanger(r.svg)
  assert.match(r.svg, /<rect\/?>/i)
})

test('sanitizeSvg strips <foreignObject>/<iframe>/<embed>/<object> with content', () => {
  const r = sanitizeSvg(
    '<svg><foreignObject><script>x</script><div>h</div></foreignObject><iframe src="http://e/x"></iframe><embed src="http://e/y"/><object data="z"></object><rect/></svg>'
  )
  assert.equal(r.ok, true)
  assertNoDanger(r.svg)
  assert.equal(r.svg.includes('x'), false)
  assert.match(r.svg, /<rect\/?>/i)
})

test('sanitizeSvg strips javascript: URLs incl mixed case and entity tricks', () => {
  const r = sanitizeSvg(
    '<svg><a xlink:href="JaVaScRiPt:alert(1)">a</a><a xlink:href="java&#115;cript:alert(2)">b</a><a xlink:href="javascript	:alert(3)">c</a></svg>'
  )
  assert.equal(r.ok, true)
  assertNoDanger(r.svg)
})

test('sanitizeSvg drops external href/xlink:href (http/https/protocol-relative)', () => {
  const r = sanitizeSvg(
    '<svg><use href="http://evil.example/a.svg#x"/><use xlink:href="https://evil.example/b.svg#y"/><use xlink:href="//evil.example/c.svg#z"/><use href="#local"/></svg>'
  )
  assert.equal(r.ok, true)
  assert.equal(r.svg.includes('evil.example'), false)
  assert.match(r.svg, /href="#local"/)
})

test('sanitizeSvg strips <style> @import and external url(), keeps #/data: url()', () => {
  const r = sanitizeSvg(
    '<svg><style>@import url("http://evil.example/a.css"); .x{background:url(https://evil.example/b.png)} .y{fill:url(#grad)} .z{mask:url(data:image/png;base64,AAA)}</style></svg>'
  )
  assert.equal(r.ok, true)
  assertNoDanger(r.svg)
  assert.equal(r.svg.includes('evil.example'), false)
  assert.match(r.svg, /url\(#grad\)/)
  assert.match(r.svg, /url\(data:image\/png/)
})

test('sanitizeSvg sanitizes style= attribute, keeps internal/data urls', () => {
  const r = sanitizeSvg(
    '<svg><rect style="fill:url(http://evil.example/c.png)"/><rect style="fill:url(#grad);mask:url(data:image/svg+xml;base64,AA)"/></svg>'
  )
  assert.equal(r.ok, true)
  assertNoDanger(r.svg)
  assert.equal(r.svg.includes('evil.example'), false)
  assert.match(r.svg, /url\(#grad\)/)
  assert.match(r.svg, /url\(data:image\/svg\+xml/)
})

test('sanitizeSvg preserves whitelisted animate family', () => {
  const r = sanitizeSvg(
    '<svg><animate attributeName="x" dur="1s"/><animateTransform attributeName="transform" type="rotate" dur="1s"/><animateMotion dur="2s"/><set attributeName="fill" to="red"/></svg>'
  )
  assert.equal(r.ok, true)
  assert.match(r.svg, /<animate\b/i)
  assert.match(r.svg, /<animateTransform\b/i)
  assert.match(r.svg, /<animateMotion\b/i)
  assert.match(r.svg, /<set\b/i)
})

test('sanitizeSvg preserves internal use + defs/gradients/clipPath/mask/filter', () => {
  const r = sanitizeSvg(
    '<svg><defs><linearGradient id="g"><stop offset="0" stop-color="#fff"/></linearGradient><radialGradient id="r"/><clipPath id="c"/><mask id="m"/><filter id="f"/></defs><use href="#g"/><rect fill="url(#g)"/></svg>'
  )
  assert.equal(r.ok, true)
  assert.match(r.svg, /<linearGradient\b/)
  assert.match(r.svg, /<clipPath\b/)
  assert.match(r.svg, /<mask\b/)
  assert.match(r.svg, /<filter\b/)
  assert.match(r.svg, /<use href="#g"/)
})

test('sanitizeSvg happy: full malicious sample has no dangerous nodes, safe nodes survive', () => {
  const r = sanitizeSvg(MALICIOUS_SVG)
  assert.equal(r.ok, true)
  assertNoDanger(r.svg)
  assert.match(r.svg, /<svg\b/)
  assert.match(r.svg, /<rect\b/i)
  assert.match(r.svg, /<animate\b/i)
  // sanitizer is idempotent — second pass yields the same output
  const again = sanitizeSvg(r.svg)
  assert.equal(again.ok, true)
  assert.equal(again.svg, r.svg)
})

test('sanitizeSvg failure: >512KB input rejected with null svg + reason', () => {
  const huge = 'a'.repeat(SVG_MAX_BYTES + 1)
  const r = sanitizeSvg(huge)
  assert.equal(r.ok, false)
  assert.equal(r.svg, null)
  assert.equal(r.reason, 'too_large')
})

test('sanitizeSvg malformed input (unclosed tag) does not throw or leak script', () => {
  const r = sanitizeSvg('<svg><rect onload="a" <script>alert(1)')
  assert.equal(r.ok, true)
  assertNoDanger(r.svg)
})

// ---------------- clampGiftConfig (todo 6: gift config schema) ----------------
// The listed key set is also the contract index.js/client.js mirror — keep the
// two clamps in lockstep with this list.
const GIFT_KEYS = [
  'giftEnabled', 'giftRoomId', 'giftTemplate', 'giftSenders', 'giftBindings',
  'giftTrigger', 'giftMaxConcurrent', 'giftShowSender', 'giftLayout', 'giftMaxAssetMB',
]
const sortedKeys = (o) => Object.keys(o).sort().join(',')

test('clampGiftConfig defaults: empty/base-less input yields exact gift defaults (master OFF, room empty)', () => {
  const out = clampGiftConfig({}, {})
  assert.equal(sortedKeys(out), [...GIFT_KEYS].sort().join(','))
  assert.deepEqual(out, GIFT_DEFAULTS)
  assert.equal(out.giftEnabled, false)
  assert.equal(out.giftRoomId, '')
  assert.equal(out.giftTemplate, '{user} 送出了 {gift}')
  assert.deepEqual(out.giftSenders, [])
  assert.deepEqual(out.giftBindings, {})
  assert.deepEqual(out.giftTrigger, { manual: true, random: false, probability: 0.05, minMs: 30000, maxMs: 120000 })
  assert.equal(out.giftMaxConcurrent, 2)
  assert.equal(out.giftShowSender, true)
  assert.deepEqual(out.giftLayout, { roll: 100, top: 0, bottom: 0 })
  assert.equal(out.giftMaxAssetMB, 8)
  // non-object / null partial must not throw and must still yield defaults
  assert.deepEqual(clampGiftConfig(null, null), GIFT_DEFAULTS)
  assert.deepEqual(clampGiftConfig(undefined, undefined), GIFT_DEFAULTS)
})

test('clampGiftConfig numeric bounds: out-of-range values clamp, not reject', () => {
  const out = clampGiftConfig({
    giftMaxConcurrent: 999,
    giftMaxAssetMB: 0,
    giftTrigger: { probability: 2, minMs: 1, maxMs: 99_999_999 },
    giftBindings: { g1: { scale: 9, durationMs: 999_999 } },
    giftLayout: { roll: 500, top: -3, bottom: 42 },
  }, {})
  assert.equal(out.giftMaxConcurrent, 10)
  assert.equal(out.giftMaxAssetMB, 1)
  assert.equal(out.giftTrigger.probability, 1)
  assert.equal(out.giftTrigger.minMs, 1000)
  assert.equal(out.giftTrigger.maxMs, 3600000)
  assert.equal(out.giftBindings.g1.scale, 2)
  assert.equal(out.giftBindings.g1.durationMs, 10000)
  assert.equal(out.giftLayout.roll, 100)
  assert.equal(out.giftLayout.top, 0)
  assert.equal(out.giftLayout.bottom, 42)
  // low side of the same ranges
  const lo = clampGiftConfig({
    giftMaxConcurrent: -5,
    giftMaxAssetMB: -1,
    giftTrigger: { probability: -1, minMs: -1, maxMs: -1 },
    giftLayout: { roll: -1 },
  }, {})
  assert.equal(lo.giftMaxConcurrent, 1)
  assert.equal(lo.giftMaxAssetMB, 1)
  assert.equal(lo.giftTrigger.probability, 0)
  assert.equal(lo.giftTrigger.minMs, 1000)
  assert.equal(lo.giftTrigger.maxMs, 1000) // never below minMs
  assert.equal(lo.giftLayout.roll, 0)
})

test('clampGiftConfig malformed types: strings/arrays/objects in the wrong slot fall back, never throw', () => {
  const out = clampGiftConfig({
    giftEnabled: 'true', // strict bool: only === true enables
    giftMaxConcurrent: 'lots',
    giftMaxAssetMB: 'big',
    giftSenders: { name: 'x' }, // object, not array
    giftBindings: [], // array, not map
    giftTrigger: [], // array, not object
    giftLayout: 'roll', // string, not object
    giftTemplate: 12345, // number coerced to string
  }, {})
  assert.equal(out.giftEnabled, false)
  assert.equal(out.giftMaxConcurrent, 2)
  assert.equal(out.giftMaxAssetMB, 8)
  assert.deepEqual(out.giftSenders, [])
  assert.deepEqual(out.giftBindings, {})
  assert.deepEqual(out.giftTrigger, GIFT_DEFAULTS.giftTrigger)
  assert.deepEqual(out.giftLayout, GIFT_DEFAULTS.giftLayout)
  assert.equal(out.giftTemplate, '12345')
  assert.equal(clampGiftConfig({ giftEnabled: true }, {}).giftEnabled, true)
  assert.equal(clampGiftConfig({ giftShowSender: 'no' }, {}).giftShowSender, true)
  assert.equal(clampGiftConfig({ giftShowSender: false }, {}).giftShowSender, false)
})

test('clampGiftConfig NaN/Infinity: non-finite numbers fall back to defaults', () => {
  const out = clampGiftConfig({
    giftMaxConcurrent: NaN,
    giftMaxAssetMB: Infinity,
    giftTrigger: { probability: -Infinity, minMs: NaN, maxMs: Infinity },
    giftBindings: { g1: { scale: NaN, durationMs: Infinity } },
    giftLayout: { roll: NaN, top: Infinity },
  }, {})
  assert.equal(out.giftMaxConcurrent, 2)
  assert.equal(out.giftMaxAssetMB, 8)
  assert.equal(out.giftTrigger.probability, 0.05)
  assert.equal(out.giftTrigger.minMs, 30000)
  assert.equal(out.giftTrigger.maxMs, 120000)
  assert.equal(out.giftBindings.g1.scale, 1)
  assert.equal(out.giftBindings.g1.durationMs, 3000)
  assert.equal(out.giftLayout.roll, 100)
  assert.equal(out.giftLayout.top, 0)
})

test('clampGiftConfig string caps: room id is digits-only+short, template/name/assetId truncated', () => {
  const out = clampGiftConfig({
    giftRoomId: ' 12-34 ',
    giftTemplate: 'T'.repeat(500),
    giftSenders: [{ name: 'N'.repeat(100), weight: 3 }],
    giftBindings: { ['k'.repeat(100)]: { assetId: 'a'.repeat(200) } },
  }, {})
  // short placeholder id (plan todo 29): never a 5–8 digit room-shaped literal
  assert.equal(out.giftRoomId, '1234')
  assert.equal(out.giftTemplate.length, 100)
  assert.equal(out.giftSenders[0].name.length, 24)
  const bindingKey = Object.keys(out.giftBindings)[0]
  assert.equal(bindingKey.length, 40)
  assert.equal(out.giftBindings[bindingKey].assetId.length, 80)
  // a non-numeric room id becomes empty, never leaves junk for a URL
  assert.equal(clampGiftConfig({ giftRoomId: 'abc' }, {}).giftRoomId, '')
  // blank template falls back to the default
  assert.equal(clampGiftConfig({ giftTemplate: '   ' }, {}).giftTemplate, GIFT_DEFAULTS.giftTemplate)
})

test('clampGiftConfig array caps: senders <=50, unnamed/non-object dropped; bindings <=2000', () => {
  const senders = []
  for (let i = 0; i < 60; i++) senders.push({ name: 's' + i, weight: 1 })
  const out = clampGiftConfig({ giftSenders: senders }, {})
  assert.equal(out.giftSenders.length, 50)
  const messy = clampGiftConfig({ giftSenders: [{ name: '' }, null, 42, { name: 'ok', weight: 5 }, { name: 'z' }] }, {})
  assert.deepEqual(messy.giftSenders, [{ name: 'ok', weight: 5 }, { name: 'z', weight: 1 }])

  const many = {}
  for (let i = 0; i < 2100; i++) many['g' + i] = { assetId: 'a' + i }
  const capped = clampGiftConfig({ giftBindings: many }, {})
  assert.equal(Object.keys(capped.giftBindings).length, 2000)
})

test('clampGiftConfig enum fields: invalid position falls back to center, valid ones survive', () => {
  assert.ok(GIFT_POSITIONS.includes('center'))
  const out = clampGiftConfig({
    giftBindings: {
      a: { assetId: 'x', position: 'diagonal' },
      b: { assetId: 'y', position: 'top-right' },
      c: { position: 7 },
    },
  }, {})
  assert.equal(out.giftBindings.a.position, 'center')
  assert.equal(out.giftBindings.b.position, 'top-right')
  assert.equal(out.giftBindings.a.loop, false)
  assert.equal(out.giftBindings.c.position, 'center')
  assert.equal(out.giftBindings.c.assetId, '')
})

test('clampGiftConfig nested trigger+layout: partial nested objects merge with defaults, maxMs >= minMs', () => {
  const out = clampGiftConfig({
    giftTrigger: { random: true },
    giftLayout: { top: 60 },
  }, {})
  assert.deepEqual(out.giftTrigger, { manual: true, random: true, probability: 0.05, minMs: 30000, maxMs: 120000 })
  assert.deepEqual(out.giftLayout, { roll: 100, top: 60, bottom: 0 })
  const inverted = clampGiftConfig({ giftTrigger: { minMs: 100000, maxMs: 5000 } }, {})
  assert.equal(inverted.giftTrigger.minMs, 100000)
  assert.equal(inverted.giftTrigger.maxMs, 100000)
  // base supplies the fallback when the partial omits a gift field
  const fromBase = clampGiftConfig({ giftEnabled: true }, { giftRoomId: '9876', giftMaxConcurrent: 7 })
  assert.equal(fromBase.giftRoomId, '9876')
  assert.equal(fromBase.giftMaxConcurrent, 7)
})

test('clampGiftConfig unknown keys: dropped from both partial and base; output is gift-only', () => {
  const out = clampGiftConfig(
    { giftNope: 1, giftRoomId: '123', enabled: false, llmModel: 'x' },
    { enabled: true, giftAlsoNo: 2, giftMaxConcurrent: 3 },
  )
  assert.equal(sortedKeys(out), [...GIFT_KEYS].sort().join(','))
  assert.equal('giftNope' in out, false)
  assert.equal('enabled' in out, false)
  assert.equal('llmModel' in out, false)
  assert.equal('giftAlsoNo' in out, false)
  assert.equal(out.giftRoomId, '123')
  assert.equal(out.giftMaxConcurrent, 3)
})

test('clampGiftConfig does not mutate partial/base and is idempotent', () => {
  const partial = { giftTrigger: { probability: 9 }, giftSenders: [{ name: 'a', weight: 2 }] }
  const base = { giftLayout: { roll: 1, top: 2, bottom: 3 } }
  const pBefore = JSON.parse(JSON.stringify(partial))
  const bBefore = JSON.parse(JSON.stringify(base))
  const once = clampGiftConfig(partial, base)
  assert.deepEqual(partial, pBefore)
  assert.deepEqual(base, bBefore)
  assert.deepEqual(clampGiftConfig(once, {}), once)
  // a null-prototype map must not blow up the binding walk
  const hostile = Object.create(null)
  hostile.giftBindings = Object.create(null)
  hostile.giftBindings.g1 = { position: 'random' }
  const out = clampGiftConfig(hostile, {})
  assert.equal(out.giftBindings.g1.position, 'random')
})

// ---------------------------------------------------------------------------
// renderGiftTip (todo 16): {user}/{gift} substitution pure function.
// ---------------------------------------------------------------------------

test('renderGiftTip substitutes {user} and {gift} in the default template', () => {
  assert.equal(renderGiftTip('{user} 送出了 {gift}', '小林', '小电视'), '小林 送出了 小电视')
  assert.equal(renderGiftTip('{gift} <- {user}', 'a', 'b'), 'b <- a')
  assert.equal(GIFT_TIP_MAX, 60)
})

test('renderGiftTip: empty/blank/missing template falls back to the default', () => {
  const def = GIFT_DEFAULTS.giftTemplate
  assert.equal(renderGiftTip('', '甲', '花'), renderGiftTip(def, '甲', '花'))
  assert.equal(renderGiftTip('   ', '甲', '花'), renderGiftTip(def, '甲', '花'))
  assert.equal(renderGiftTip(null, '甲', '花'), renderGiftTip(def, '甲', '花'))
  assert.equal(renderGiftTip(undefined, '甲', '花'), '甲 送出了 花')
})

test('renderGiftTip: missing {gift} token still renders; unknown tokens verbatim', () => {
  assert.equal(renderGiftTip('欢迎 {user}', '甲', '小电视'), '欢迎 甲')
  assert.equal(renderGiftTip('{user}{gift}{unknown}', 'a', 'b'), 'ab{unknown}')
})

test('renderGiftTip: null/garbage user or gift degrade to a string (no throw)', () => {
  assert.equal(renderGiftTip('{user}|{gift}', null, undefined), '|')
  assert.equal(renderGiftTip('{user}|{gift}', 42, {}), '42|[object Object]')
})

test('renderGiftTip: result is capped at GIFT_TIP_MAX (60) chars', () => {
  const longGift = '礼'.repeat(80)
  const out = renderGiftTip('{user} 送出了 {gift}', '甲', longGift)
  assert.equal(out.length, GIFT_TIP_MAX)
  assert.equal(out, ('甲 送出了 ' + longGift).slice(0, GIFT_TIP_MAX))
  assert.equal(renderGiftTip('x'.repeat(200), 'a', 'b').length, GIFT_TIP_MAX)
})

// ---------------------------------------------------------------------------
// pickSender + sender batch parse/format (todo 19).
// A deterministic fixed-seed PRNG — NEVER Math.random — so the distribution
// assertion is reproducible. LCG constants are the classic Numerical Recipes
// ones; only the sequence matters, not statistical quality.
// ---------------------------------------------------------------------------
function lcg(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

test('pickSender: empty/invalid list -> 匿名', () => {
  assert.equal(GIFT_ANONYMOUS_SENDER, '匿名')
  assert.equal(pickSender([]), '匿名')
  assert.equal(pickSender(null), '匿名')
  assert.equal(pickSender(undefined), '匿名')
  assert.equal(pickSender('nope'), '匿名')
  assert.equal(pickSender([{ name: '' }, { name: '   ' }]), '匿名')
  assert.equal(pickSender([null, 42, {}]), '匿名')
})

test('pickSender: single sender / default weight / zero-weight uniform fallback', () => {
  assert.equal(pickSender([{ name: '甲' }]), '甲')
  assert.equal(pickSender([{ name: '甲', weight: 5 }]), '甲')
  // missing / malformed weights default to 1
  assert.equal(pickSender([{ name: '甲', weight: 'x' }], () => 0.9), '甲')
  assert.equal(pickSender([{ name: '甲' }, { name: '乙' }], () => 0), '甲')
  assert.equal(pickSender([{ name: '甲' }, { name: '乙' }], () => 0.999), '乙')
  // every weight 0 -> uniform fallback still returns a listed member
  const pick = pickSender([{ name: '甲', weight: 0 }, { name: '乙', weight: 0 }], () => 0.5)
  assert.ok(pick === '甲' || pick === '乙', 'zero-total fallback -> member, got ' + pick)
})

test('pickSender: weight distribution over 10k draws deviates <5% (fixed seed)', () => {
  const rand = lcg(20260925)
  const senders = [{ name: 'A', weight: 1 }, { name: 'B', weight: 3 }]
  const N = 10000
  const counts = { A: 0, B: 0 }
  for (let i = 0; i < N; i++) counts[pickSender(senders, rand)]++
  const exp = { A: 0.25, B: 0.75 }
  const devA = Math.abs(counts.A / N - exp.A)
  const devB = Math.abs(counts.B / N - exp.B)
  assert.ok(devA < 0.05, `A weight 1 -> ${(counts.A / N).toFixed(4)} vs 0.25 (dev ${devA.toFixed(4)})`)
  assert.ok(devB < 0.05, `B weight 3 -> ${(counts.B / N).toFixed(4)} vs 0.75 (dev ${devB.toFixed(4)})`)
  assert.equal(counts.A + counts.B, N, 'every draw returns a listed sender')
})

test('parseSenderBatch: comma/newline/CJK-comma split, 名字*权重, default weight 1', () => {
  const r = parseSenderBatch('甲, 乙*3\n丙*0.5，丁、戊')
  assert.deepEqual(r.senders, [
    { name: '甲', weight: 1 },
    { name: '乙', weight: 3 },
    { name: '丙', weight: 0.5 },
    { name: '丁', weight: 1 },
    { name: '戊', weight: 1 },
  ])
  assert.equal(r.invalid.length, 0)
  assert.equal(r.overflow, 0)
})

test('parseSenderBatch: blank lines skipped, illegal lines ignored + reported (never throws)', () => {
  const r = parseSenderBatch('\n甲\n*5\n乙*abc\n   \n丙*\n丁*')
  assert.deepEqual(r.senders, [{ name: '甲', weight: 1 }])
  assert.deepEqual(r.invalid.map((x) => x.reason), ['empty_name', 'bad_weight', 'bad_weight', 'bad_weight'])
  assert.deepEqual(r.invalid.map((x) => x.line), [3, 4, 6, 7])
  assert.equal(parseSenderBatch(null).senders.length, 0)
  assert.equal(parseSenderBatch(undefined).invalid.length, 0)
})

test('parseSenderBatch: caps at GIFT_SENDERS_MAX (50), names truncated to GIFT_SENDER_NAME_MAX (24)', () => {
  assert.equal(GIFT_SENDERS_MAX, 50)
  assert.equal(GIFT_SENDER_NAME_MAX, 24)
  const lines = []
  for (let i = 0; i < 60; i++) lines.push('s' + i)
  const r = parseSenderBatch(lines.join('\n'))
  assert.equal(r.senders.length, 50)
  assert.equal(r.senders[0].name, 's0')
  assert.equal(r.overflow, 10)
  const long = parseSenderBatch('N'.repeat(100))
  assert.equal(long.senders[0].name.length, GIFT_SENDER_NAME_MAX)
})

test('formatSenderBatch round-trips through parseSenderBatch', () => {
  const senders = [
    { name: '甲', weight: 1 },
    { name: '乙', weight: 3 },
    { name: '丙', weight: 0 },
  ]
  const text = formatSenderBatch(senders)
  assert.equal(text, '甲\n乙*3\n丙*0')
  assert.deepEqual(parseSenderBatch(text).senders, senders)
  assert.equal(formatSenderBatch(null), '')
  assert.equal(formatSenderBatch([null, { name: '' }]), '')
})

test('mapCatalogGift: API raw -> every GIFT_CATALOG_FIELD present, milli price /1000, files fallback', () => {
  const raw = {
    id: 999100,
    name: '小电视飞船',
    price: 1245000,
    coin_type: 'gold',
    type: 1,
    desc: 'a gift',
    effect_id: 42,
    animation_frame_num: 30,
    stay_time: 5000,
    combo_resources_id: 7,
    full_sc_web: 'https://x/full.webm',
    img_basic: 'https://x/basic.png',
    files: { gif: 'https://x/g.gif', webp: 'https://x/w.webp' },
  }
  const g = mapCatalogGift(raw)
  // shape contract: all catalog fields always present (consumers never guard)
  assert.deepEqual(Object.keys(g).sort(), [...GIFT_CATALOG_FIELDS].sort())
  assert.equal(g.id, 999100)
  assert.equal(g.name, '小电视飞船')
  assert.equal(g.price, 1245) // milli-元 -> 元
  assert.equal(g.coin_type, 'gold')
  assert.equal(g.type, 1)
  assert.equal(g.desc, 'a gift')
  assert.equal(g.effect_id, 42)
  assert.equal(g.frame_num, 30) // animation_frame_num alias
  assert.equal(g.stay_time, 5000)
  assert.equal(g.combo_id, 7) // combo_resources_id alias
  assert.equal(g.full_sc_web, 'https://x/full.webm')
  assert.equal(g.img_basic, 'https://x/basic.png')
  assert.equal(g.gif, 'https://x/g.gif') // files.* fallback
  assert.equal(g.webp, 'https://x/w.webp')
  assert.equal(g.full_sc_horizontal, null) // absent -> null (not undefined)
  assert.equal(g.img_dynamic, null)
})

test('mapCatalogGift: yuan unit + alias fields + blank/garbage degrade (never throws)', () => {
  const g = mapCatalogGift(
    { price: 30, effectId: 5, frame_animation_num: 12, combo_id: 3, name: '' },
    { priceUnit: 'yuan' },
  )
  assert.equal(g.price, 30) // yuan: already 元, no division
  assert.equal(g.effect_id, 5) // effectId alias
  assert.equal(g.frame_num, 12) // frame_animation_num alias
  assert.equal(g.combo_id, 3)
  assert.equal(g.name, '(未命名)') // blank -> placeholder
  assert.equal(g.id, null)

  const empty = mapCatalogGift(null)
  assert.equal(empty.price, 0)
  assert.equal(empty.name, '(未命名)')
  assert.deepEqual(Object.keys(empty).sort(), [...GIFT_CATALOG_FIELDS].sort())
  assert.doesNotThrow(() => mapCatalogGift('nope'))
  assert.doesNotThrow(() => mapCatalogGift(undefined))
})
