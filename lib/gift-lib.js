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

// ---------------------------------------------------------------------------
// SVG whitelist sanitizer (hand-written; no third-party sanitizer dependency).
//
// Host-only pure function: the client is a `window.__ModuleLoader__` factory and
// cannot share Node modules, so this MUST NOT be re-implemented client-side.
// Applied at ingest (todo 3); playback (todo 14) only injects the sanitized text.
//
// sanitizeSvg(text) -> { ok:true, svg } | { ok:false, reason, svg:null }
//   reason ∈ 'invalid_type' | 'too_large'
// Callers turn `ok:false` into HTTP 400 with the reason.
// ---------------------------------------------------------------------------

/** SVG-specific cap (independent of the giftMaxAssetMB upload cap). */
export const SVG_MAX_BYTES = 512 * 1024

// Elements allowed to survive. Local name, lowercased (camelCase folded).
const SVG_WHITELIST = new Set([
  'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'defs', 'use', 'lineargradient', 'radialgradient', 'stop',
  'style', 'animate', 'animatetransform', 'animatemotion', 'set',
  'clippath', 'mask', 'filter',
])

// Elements removed together with their inner content.
const SVG_DROP_CONTENT = new Set([
  'script', 'foreignobject', 'iframe', 'embed', 'object',
  'noscript', 'template', 'applet', 'frame', 'frameset', 'handler', 'listener',
])

// HTML-ish void/structural elements that are never in an SVG whitelist.
const SVG_DROP_TAG_CONTENT_KEPT = new Set(['a', 'image', 'symbol', 'marker', 'pattern', 'switch', 'metadata', 'desc', 'title'])

const HTML_ENTITIES = { colon: ':', tab: '\t', newline: '\n', lpar: '(', rpar: ')', sol: '/', bsol: '\\' }

function decodeEntities(s) {
  if (!s || s.indexOf('&') === -1) return s
  return s
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)) } catch { return '' } })
    .replace(/&#(\d+);?/g, (_, d) => { try { return String.fromCodePoint(parseInt(d, 10)) } catch { return '' } })
    .replace(/&(colon|tab|newline|lpar|rpar|sol|bsol);?/gi, (_, n) => HTML_ENTITIES[n.toLowerCase()] || '')
}

/** Strip CSS a sanitized SVG must never carry. */
function sanitizeCss(css) {
  let s = String(css || '')
  s = s.replace(/@import[^;]*;?/gi, '')
  s = s.replace(/url\s*\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi, (full, a, b, c) => {
    const target = (a != null ? a : b != null ? b : c || '').trim()
    const t = target.replace(/[\u0000-\u0020\u007f]/g, '').toLowerCase()
    if (t.startsWith('#') || t.startsWith('data:')) return full
    return 'none'
  })
  s = s.replace(/javascript\s*:/gi, '')
  return s
}

/** End index of a start tag, skipping `>` inside quoted attribute values. */
function findTagEnd(s, from) {
  let q = null
  for (let j = from; j < s.length; j++) {
    const c = s[j]
    if (q) {
      if (c === q) q = null
    } else if (c === '"' || c === "'") {
      q = c
    } else if (c === '>') {
      return j
    }
  }
  return -1
}

function localName(name) {
  const n = name.includes(':') ? name.split(':').pop() : name
  return n.toLowerCase()
}

/** Filter one element's attribute text; returns ` name="value"` fragments. */
function sanitizeAttrs(attrText) {
  let out = ''
  const re = /([^\s"'=<>`/]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g
  let m
  while ((m = re.exec(attrText))) {
    const rawName = m[1]
    if (!rawName) continue
    // Reject junk tokens (e.g. `script` parsed out of a stray `<script`) that
    // are not separated from the previous token by whitespace/slash.
    if (m.index > 0 && !/[\s/]/.test(attrText[m.index - 1])) continue
    const name = rawName.replace(/[\u0000-\u001f\u007f]/g, '').toLowerCase()
    const local = localName(name)
    // Event handlers: any on* name, incl. namespace variants (xlink:onload).
    if (!name || local.startsWith('on') || name.startsWith('on')) continue

    let value = m[2] == null ? null : m[2]
    if (value != null && (value[0] === '"' || value[0] === "'")) value = value.slice(1, -1)

    const decoded = decodeEntities(value || '')
    const norm = decoded.replace(/[\u0000-\u0020\u007f]/g, '').toLowerCase()
    if (norm.includes('javascript:')) continue

    if (local === 'href') {
      // `use` may only reference internal fragments.
      if (!norm.startsWith('#')) continue
    } else if (local === 'src') {
      continue // no whitelisted element legitimately uses src
    }

    const finalValue = local === 'style' ? sanitizeCss(value || '') : value
    if (finalValue == null || finalValue === '') out += ' ' + rawName
    else out += ' ' + rawName + '="' + String(finalValue).replace(/"/g, '&quot;') + '"'
  }
  return out
}

/**
 * Whitelist sanitize an SVG string. Pure; never throws on malformed input.
 */
export function sanitizeSvg(text) {
  if (typeof text !== 'string') return { ok: false, reason: 'invalid_type', svg: null }
  const bytes = Buffer.byteLength(text, 'utf8')
  if (bytes > SVG_MAX_BYTES) return { ok: false, reason: 'too_large', svg: null, bytes }

  const out = []
  const n = text.length
  let i = 0
  let dropped = null // local name of an element whose content we are swallowing

  while (i < n) {
    const lt = text.indexOf('<', i)
    if (lt === -1) {
      if (!dropped) out.push(text.slice(i))
      break
    }
    if (lt > i && !dropped) out.push(text.slice(i, lt))

    if (text.startsWith('<!--', lt)) {
      const end = text.indexOf('-->', lt + 4)
      i = end === -1 ? n : end + 3
      continue
    }
    if (text.startsWith('<![CDATA[', lt)) {
      const end = text.indexOf(']]>', lt + 9)
      i = end === -1 ? n : end + 3
      continue
    }
    if (text.startsWith('<!', lt) || text.startsWith('<?', lt)) {
      const end = text.indexOf('>', lt)
      i = end === -1 ? n : end + 1
      continue
    }

    if (text[lt + 1] === '/') {
      const end = text.indexOf('>', lt)
      if (end === -1) { i = n; continue }
      const cname = text.slice(lt + 2, end).trim()
      const clocal = localName(cname)
      if (dropped) {
        if (clocal === dropped) dropped = null
      } else if (SVG_WHITELIST.has(clocal)) {
        // Preserve original case so camelCase SVG (linearGradient/clipPath) stays valid XML.
        out.push('</' + cname + '>')
      }
      i = end + 1
      continue
    }

    const end = findTagEnd(text, lt + 1)
    if (end === -1) { i = n; continue }
    const raw = text.slice(lt + 1, end)
    i = end + 1
    if (dropped) continue

    const nameMatch = /^([a-zA-Z_][\w:.-]*)/.exec(raw)
    if (!nameMatch) continue
    const rawName = nameMatch[1]
    const local = localName(rawName.toLowerCase())
    const selfClose = /\/\s*$/.test(raw)

    if (SVG_DROP_CONTENT.has(local) || SVG_DROP_TAG_CONTENT_KEPT.has(local)) {
      if (!selfClose) dropped = local
      continue
    }
    if (!SVG_WHITELIST.has(local)) continue // unknown element: drop tag, keep content

    if (local === 'style') {
      if (selfClose) { out.push('<style/>'); continue }
      const close = text.toLowerCase().indexOf('</style', i)
      let inner
      if (close === -1) { inner = text.slice(i); i = n } else {
        inner = text.slice(i, close)
        const gt = text.indexOf('>', close)
        i = gt === -1 ? n : gt + 1
      }
      out.push('<style>' + sanitizeCss(inner) + '</style>')
      continue
    }

    out.push('<' + rawName + sanitizeAttrs(raw.slice(nameMatch[0].length)) + (selfClose ? '/>' : '>'))
  }

  return { ok: true, svg: out.join('') }
}
