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
