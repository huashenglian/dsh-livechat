import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  samplePresets,
  isBlocked,
  pickLayout,
  pickColor,
  canEnterTrack,
  PRESET_PACKS,
  packNames,
} from '../lib/presets.js'

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
