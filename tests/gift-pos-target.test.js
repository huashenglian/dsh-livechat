// 特效位置 panel target resolution (0.6.9 refine task 9).
//
// The decision lives in `lib/client.js` (a browser `window.__ModuleLoader__`
// factory, not importable from Node), so the two PURE functions are extracted
// from the shipped source and exercised here. A rename/shape change makes the
// extraction throw — the test then fails instead of silently testing nothing.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const SRC = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')

/** Slice `function <name>(...) { ... }` out of the bundle by brace matching. */
function extractFn(src, name) {
  const start = src.indexOf('function ' + name + '(')
  assert.ok(start >= 0, 'client.js must declare function ' + name)
  const open = src.indexOf('{', start)
  let depth = 0
  for (let i = open; i < src.length; i++) {
    const ch = src[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return src.slice(start, i + 1)
    }
  }
  throw new Error('unbalanced braces in ' + name)
}

const giftIdFromSource = new Function('return (' + extractFn(SRC, 'giftIdFromSource') + ')')()
const giftPosGid = new Function(
  'giftIdFromSource',
  'return (' + extractFn(SRC, 'giftPosGid') + ')',
)(giftIdFromSource)

// Fixtures mirror the real store: the packaged default vector assets are
// `source: 'builtin'`, the boot-seeded bilibili cards are `source: 'gift:<id>'`.
const CARD_BUILTIN = { id: 'g_vec1', name: '彩带飘落.svg', source: 'builtin' }
const CARD_UPLOAD = { id: 'g_up1', name: 'my.svg', source: 'user' }
const CARD_GIFT = { id: 'g_seed31225', name: '牛哇牛哇.gif', source: 'gift:31225' }
const CARD_SIBLING = { id: 'g_seed99999', name: '干杯.gif', source: 'gift:31116' }
const ASSETS = [CARD_BUILTIN, CARD_UPLOAD, CARD_GIFT, CARD_SIBLING]

test('giftIdFromSource parses only gift: prefixed sources', () => {
  assert.equal(giftIdFromSource('gift:31225'), '31225')
  assert.equal(giftIdFromSource('builtin'), '')
  assert.equal(giftIdFromSource('user'), '')
  assert.equal(giftIdFromSource(null), '')
})

test('default vector (builtin) card bound via 自定义 resolves to its gift', () => {
  // The reported bug: source is 'builtin', so the old source-only read returned
  // '' and the panel showed 「未绑定礼物，位置不适用」 even though the card WAS
  // bound (`giftBindings[34391].assetId === card.id`).
  assert.equal(giftIdFromSource(CARD_BUILTIN.source), '')
  const bindings = { 34391: { assetId: 'g_vec1', position: 'center', scale: 1, durationMs: 3000, loop: false } }
  assert.equal(giftPosGid(CARD_BUILTIN, bindings, ASSETS), '34391')
})

test('uploaded (user) card bound via 自定义 resolves to its gift', () => {
  const bindings = { 99999: { assetId: 'g_up1', position: 'top-left', scale: 1, durationMs: 3000, loop: false } }
  assert.equal(giftPosGid(CARD_UPLOAD, bindings, ASSETS), '99999')
})

test('gift-imported card still resolves through its own binding', () => {
  const bindings = { 31225: { assetId: 'g_seed31225', position: 'center', scale: 1, durationMs: 3000, loop: false } }
  assert.equal(giftPosGid(CARD_GIFT, bindings, ASSETS), '31225')
})

test('gift card whose binding was re-pointed at a sibling keeps its source gift', () => {
  // Rebinding a gift to another existing card must not make the imported card
  // look unbound (pre-existing behaviour, kept).
  const bindings = { 31225: { assetId: 'g_seed99999', position: 'center', scale: 1, durationMs: 3000, loop: false } }
  assert.equal(giftPosGid(CARD_GIFT, bindings, ASSETS), '31225')
})

test('genuinely unbound cards stay on the unbound hint', () => {
  assert.equal(giftPosGid(CARD_BUILTIN, {}, ASSETS), '')
  assert.equal(giftPosGid(CARD_BUILTIN, { 31225: { assetId: 'g_seed31225' } }, ASSETS), '')
  assert.equal(giftPosGid(CARD_GIFT, {}, ASSETS), '')
  assert.equal(giftPosGid(null, {}, ASSETS), '')
})

test('dangling bindings stay on the unbound hint', () => {
  // assetId points at a card the assets list no longer has.
  const dangling = { 31225: { assetId: 'g_deleted', position: 'center', scale: 1, durationMs: 3000, loop: false } }
  assert.equal(giftPosGid(CARD_GIFT, dangling, ASSETS), '')
  // assetId missing / empty is dangling too.
  assert.equal(giftPosGid(CARD_BUILTIN, { 31225: { assetId: '' } }, ASSETS), '')
  assert.equal(giftPosGid(CARD_GIFT, { 31225: {} }, ASSETS), '')
  // A binding that points at the clicked card but the assets list is not
  // fetched yet ([]) must not render a broken panel either.
  assert.equal(giftPosGid(CARD_BUILTIN, { 34391: { assetId: 'g_vec1' } }, []), '')
})

test('a shared asset bound by two gifts resolves deterministically', () => {
  const bindings = {
    11111: { assetId: 'g_vec1', position: 'center', scale: 1, durationMs: 3000, loop: false },
    22222: { assetId: 'g_vec1', position: 'top', scale: 1, durationMs: 3000, loop: false },
  }
  assert.equal(giftPosGid(CARD_BUILTIN, bindings, ASSETS), '11111')
})
