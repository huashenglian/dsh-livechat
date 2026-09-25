/**
 * Gift asset library storage + CRUD (standalone, plain Node builtins).
 *
 * Disk layout: $DSH_HOME/danmaku-gifts/{files/,manifest.json,catalog.json}
 * manifest schema v1:
 *   {version:1, folders:[{id,name,parentId}],
 *    items:[{id,name,kind:'svga'|'image'|'svg',file,bytes,weight,folderId,source,createdAt}]}
 *
 * `home` (the DSH_HOME root) is injectable so tests run on temp dirs and never
 * touch the real ~/.dsh. No dsh private deps; no binary content in the manifest.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync, rmSync, renameSync } from 'node:fs'
import { join, basename, extname, relative, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

// Whitelist — unknown extensions are REJECTED, never silently rewritten.
export const GIFT_EXT = new Set(['.svg', '.svga', '.gif', '.apng', '.webp', '.png', '.jpg'])
const IMAGE_EXT = new Set(['.gif', '.apng', '.webp', '.png', '.jpg'])

function resolveHome(home) {
  return home || process.env.DSH_HOME || join(homedir(), '.dsh')
}

export function giftDir(home) {
  return join(resolveHome(home), 'danmaku-gifts')
}

export function giftFilesDir(home) {
  return join(giftDir(home), 'files')
}

export function giftManifestPath(home) {
  return join(giftDir(home), 'manifest.json')
}

export function giftCatalogPath(home) {
  return join(giftDir(home), 'catalog.json')
}

export function uid(prefix) {
  return String(prefix || '') + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

function normExt(ext) {
  const e = String(ext || '').toLowerCase()
  if (!e) return ''
  return e.startsWith('.') ? e : '.' + e
}

/** Whitelist extension → kind, or null when not accepted. */
export function kindForExt(ext) {
  const e = normExt(ext)
  if (e === '.svg') return 'svg'
  if (e === '.svga') return 'svga'
  if (IMAGE_EXT.has(e)) return 'image'
  return null
}

function emptyManifest() {
  return { version: 1, folders: [], items: [] }
}

export function loadGiftManifest(home) {
  try {
    const p = giftManifestPath(home)
    if (existsSync(p)) {
      const raw = JSON.parse(readFileSync(p, 'utf8'))
      if (raw && Array.isArray(raw.items)) {
        return {
          version: 1,
          folders: Array.isArray(raw.folders) ? raw.folders : [],
          items: raw.items,
        }
      }
    }
  } catch {
    /* malformed / unreadable → empty */
  }
  return emptyManifest()
}

/** Atomic write: tmp file + rename, so a crash never leaves a half-written manifest. */
export function saveGiftManifest(m, home) {
  try {
    const dir = giftDir(home)
    mkdirSync(dir, { recursive: true })
    const p = giftManifestPath(home)
    const tmp = p + '.tmp-' + process.pid + '-' + Math.random().toString(36).slice(2, 8)
    const body = JSON.stringify({ version: 1, folders: m.folders || [], items: m.items || [] }, null, 2)
    writeFileSync(tmp, body, 'utf8')
    try {
      renameSync(tmp, p)
    } catch (e) {
      try { unlinkSync(tmp) } catch { /* ignore */ }
      throw e
    }
    return true
  } catch {
    return false
  }
}

export function toPublicFolder(f) {
  return { id: f.id, name: f.name, parentId: f.parentId || null }
}

export function publicUrl(id) {
  return '/api/danmaku/gift/file?id=' + encodeURIComponent(id)
}

export function toPublicItem(it) {
  return {
    id: it.id,
    name: it.name,
    kind: it.kind,
    bytes: Number(it.bytes) || 0,
    weight: Number(it.weight) || 0,
    folderId: it.folderId || null,
    source: it.source || 'user',
    createdAt: it.createdAt || null,
    url: publicUrl(it.id),
  }
}

function ensureDirs(home) {
  mkdirSync(giftFilesDir(home), { recursive: true })
}

function removeFile(home, file) {
  try {
    const p = join(giftFilesDir(home), file)
    if (existsSync(p)) unlinkSync(p)
  } catch {
    /* ignore */
  }
}

function countDescendants(manifest, folderId) {
  let folders = 0
  let items = 0
  const walk = (id) => {
    for (const it of manifest.items) if ((it.folderId || null) === id) items++
    for (const f of manifest.folders) {
      if ((f.parentId || null) === id) {
        folders++
        walk(f.id)
      }
    }
  }
  walk(folderId)
  return { folders, items }
}

function ensureFolderChain(manifest, parentFolderId, parts) {
  let parent = parentFolderId || null
  for (const rawName of parts) {
    const name = String(rawName).slice(0, 40)
    const existing = manifest.folders.find((f) => (f.parentId || null) === parent && f.name === name)
    if (existing) {
      parent = existing.id
      continue
    }
    const f = { id: uid('f_'), name, parentId: parent }
    manifest.folders.push(f)
    parent = f.id
  }
  return parent
}

export function createFolder(name, parentId, home) {
  const manifest = loadGiftManifest(home)
  const folder = { id: uid('f_'), name: String(name || '新建文件夹').slice(0, 40), parentId: parentId || null }
  manifest.folders.push(folder)
  saveGiftManifest(manifest, home)
  return toPublicFolder(folder)
}

export function renameFolder(id, name, home) {
  const manifest = loadGiftManifest(home)
  const f = manifest.folders.find((x) => x.id === id)
  if (!f) return { ok: false, reason: 'not_found' }
  f.name = String(name || f.name).slice(0, 40)
  saveGiftManifest(manifest, home)
  return { ok: true, folder: toPublicFolder(f) }
}

/** Delete folder. force=true removes nested folders + items (+ their files). */
export function deleteFolder(id, force, home) {
  const manifest = loadGiftManifest(home)
  const f = manifest.folders.find((x) => x.id === id)
  if (!f) return { ok: false, reason: 'not_found' }
  const nested = countDescendants(manifest, id)
  if ((nested.folders > 0 || nested.items > 0) && !force) {
    return { ok: false, reason: 'not_empty', folders: nested.folders, items: nested.items }
  }
  const doomedFiles = []
  const doomedFolders = new Set([id])
  const walk = (fid) => {
    for (const it of manifest.items) if ((it.folderId || null) === fid) doomedFiles.push(it.file)
    for (const c of manifest.folders) {
      if ((c.parentId || null) === fid) {
        doomedFolders.add(c.id)
        walk(c.id)
      }
    }
  }
  walk(id)
  manifest.folders = manifest.folders.filter((x) => !doomedFolders.has(x.id))
  manifest.items = manifest.items.filter((x) => !doomedFolders.has(x.folderId || null))
  saveGiftManifest(manifest, home)
  for (const file of doomedFiles) removeFile(home, file)
  return { ok: true, removedFolders: doomedFolders.size, removedItems: doomedFiles.length }
}

export function moveItems(itemIds, folderId, home) {
  const manifest = loadGiftManifest(home)
  let n = 0
  for (const id of itemIds || []) {
    const it = manifest.items.find((x) => x.id === id)
    if (it) {
      it.folderId = folderId || null
      n++
    }
  }
  saveGiftManifest(manifest, home)
  return { ok: true, moved: n }
}

export function deleteItems(ids, home) {
  const manifest = loadGiftManifest(home)
  const set = new Set(ids || [])
  const doomed = manifest.items.filter((x) => set.has(x.id))
  manifest.items = manifest.items.filter((x) => !set.has(x.id))
  saveGiftManifest(manifest, home)
  for (const it of doomed) removeFile(home, it.file)
  return { ok: true, removed: doomed.length }
}

export function setWeight(id, weight, home) {
  const manifest = loadGiftManifest(home)
  const it = manifest.items.find((x) => x.id === id)
  if (!it) return { ok: false, reason: 'not_found' }
  it.weight = Math.max(0, Number(weight) || 0)
  saveGiftManifest(manifest, home)
  return { ok: true, weight: it.weight }
}

/** Wipe all files/folders but KEEP an empty manifest — so seed does not resurrect them. */
export function clearAll(home) {
  try {
    rmSync(giftFilesDir(home), { recursive: true, force: true })
  } catch {
    /* ignore */
  }
  mkdirSync(giftFilesDir(home), { recursive: true })
  saveGiftManifest(emptyManifest(), home)
  return { ok: true }
}

/**
 * Add one asset buffer. Unknown extension / empty buffer → null, no disk residue.
 * `source` defaults to 'user' (seed uses 'builtin').
 */
export function addAsset({ name, buffer, folderId, weight, ext, source, home } = {}) {
  if (!buffer || !buffer.length) return null
  const kind = kindForExt(ext || extname(name || ''))
  if (!kind) return null
  const h = resolveHome(home)
  ensureDirs(h)
  const id = uid('g_')
  const file = id + normExt(ext || extname(name || ''))
  writeFileSync(join(giftFilesDir(h), file), buffer)
  const manifest = loadGiftManifest(h)
  const item = {
    id,
    name: String(name || 'asset').slice(0, 80),
    kind,
    file,
    bytes: buffer.length,
    weight: Number(weight) || 1,
    folderId: folderId || null,
    source: source || 'user',
    createdAt: Date.now(),
  }
  manifest.items.push(item)
  saveGiftManifest(manifest, h)
  return toPublicItem(item)
}

/** Default in-package seed source (may not exist in dev; ensureSeed skips then). */
export function defaultSeedDir() {
  try {
    return fileURLToPath(new URL('../assets/gift-defaults', import.meta.url))
  } catch {
    return null
  }
}

function walkAssetFiles(root) {
  const out = []
  const walk = (dir) => {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const ent of entries) {
      if (ent.name.startsWith('.')) continue
      const p = join(dir, ent.name)
      if (ent.isDirectory()) walk(p)
      else if (GIFT_EXT.has(normExt(extname(ent.name)))) out.push(p)
    }
  }
  walk(root)
  return out
}

/**
 * First-boot seed. Runs ONLY when manifest.json is missing — a cleared library
 * (manifest present, files/ empty) must never resurrect.
 */
export function ensureSeed({ sourceDir, home } = {}) {
  const h = resolveHome(home)
  if (existsSync(giftManifestPath(h))) return { ok: true, seeded: 0, skipped: 'exists' }
  const src = sourceDir || defaultSeedDir()
  if (!src || !existsSync(src)) return { ok: true, seeded: 0, skipped: 'no_source' }
  const files = walkAssetFiles(src)
  if (!files.length) return { ok: true, seeded: 0, skipped: 'empty' }
  let seeded = 0
  for (const filePath of files) {
    try {
      const buffer = readFileSync(filePath)
      const relParts = relative(src, dirname(filePath)).split(/[\\/]/).filter(Boolean)
      const manifest = loadGiftManifest(h)
      const folderId = relParts.length ? ensureFolderChain(manifest, null, relParts) : null
      if (relParts.length) saveGiftManifest(manifest, h)
      const item = addAsset({
        name: basename(filePath),
        buffer,
        folderId,
        weight: 1,
        ext: extname(filePath),
        source: 'builtin',
        home: h,
      })
      if (item) seeded++
    } catch {
      /* skip unreadable file */
    }
  }
  return { ok: true, seeded, skipped: null }
}
