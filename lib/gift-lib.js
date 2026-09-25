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

// ---------------------------------------------------------------------------
// Gift config schema + clamp (todo 6).
//
// Host + client both keep a copy of these fields (client.js is a
// `window.__ModuleLoader__` factory and cannot import Node modules). This pure
// function is the CANONICAL clamp: index.js calls it from clampConfig, and the
// unit tests pin every boundary. Client clamp mirrors the same ranges — keep
// them in lockstep when a range changes.
//
// Every field tolerates malformed input (string where a number is expected,
// array where an object is, NaN/Infinity, over-long strings/arrays) and falls
// back rather than rejecting: a rejected section would silently drop the whole
// user config. Unknown keys are dropped.
//
// Master switch defaults OFF and `giftRoomId` defaults EMPTY — no room id is
// ever hard-coded (privacy: the room id only ever comes from the user).
// ---------------------------------------------------------------------------

/** Effect anchor presets (todo 13 maps these to normalized points). */
export const GIFT_POSITIONS = ['center', 'top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'random']

export const GIFT_DEFAULTS = {
  giftEnabled: false,
  giftRoomId: '',
  giftTemplate: '{user} 送出了 {gift}',
  giftSenders: [],
  giftBindings: {},
  giftTrigger: { manual: true, random: false, probability: 0.05, minMs: 30000, maxMs: 120000 },
  giftMaxConcurrent: 2,
  giftShowSender: true,
  giftLayout: { roll: 100, top: 0, bottom: 0 },
  giftMaxAssetMB: 8,
}

const GIFT_KEYS = Object.keys(GIFT_DEFAULTS)
const GIFT_SENDERS_MAX = 50
const GIFT_SENDER_NAME_MAX = 24
const GIFT_BINDINGS_MAX = 2000
const GIFT_ROOM_ID_MAX = 20
const GIFT_TEMPLATE_MAX = 100
const GIFT_ASSET_ID_MAX = 80
const GIFT_BINDING_KEY_MAX = 40

function giftNum(v, min, max, def) {
  const n = Number(v)
  if (!Number.isFinite(n)) return def
  return Math.min(max, Math.max(min, n))
}

/**
 * Clamp the gift slice of a config. Returns an object with exactly the gift
 * keys (never mutates `partial`/`base`). `base` supplies per-field fallbacks so
 * a partial patch passed to index.js keeps previously saved values.
 *
 * @param {object} [partial] incoming (possibly hostile) gift fields
 * @param {object} [base] prior config / defaults to fall back to
 */
export function clampGiftConfig(partial, base) {
  const p = partial && typeof partial === 'object' ? partial : {}
  const b = base && typeof base === 'object' ? base : {}
  const pick = (k) => (p[k] !== undefined ? p[k] : (b[k] !== undefined ? b[k] : GIFT_DEFAULTS[k]))
  const d = GIFT_DEFAULTS
  const out = {}

  out.giftEnabled = pick('giftEnabled') === true
  // Room ids are numeric; strip anything else (a pasted URL must not reach the API).
  out.giftRoomId = String(pick('giftRoomId') == null ? '' : pick('giftRoomId')).replace(/[^0-9]/g, '').slice(0, GIFT_ROOM_ID_MAX)

  const tplRaw = pick('giftTemplate')
  const tpl = String(tplRaw == null ? '' : tplRaw).slice(0, GIFT_TEMPLATE_MAX)
  out.giftTemplate = tpl.trim() ? tpl : d.giftTemplate

  const senders = pick('giftSenders')
  out.giftSenders = Array.isArray(senders)
    ? senders
        .slice(0, GIFT_SENDERS_MAX)
        .filter((s) => s && typeof s === 'object' && !Array.isArray(s))
        .map((s) => ({
          name: String(s.name == null ? '' : s.name).slice(0, GIFT_SENDER_NAME_MAX),
          weight: giftNum(s.weight, 0, 100, 1),
        }))
        .filter((s) => s.name !== '')
    : []

  out.giftBindings = {}
  const bindings = pick('giftBindings')
  if (bindings && typeof bindings === 'object' && !Array.isArray(bindings)) {
    let n = 0
    for (const key of Object.keys(bindings)) {
      if (n >= GIFT_BINDINGS_MAX) break
      const v = bindings[key]
      if (!v || typeof v !== 'object' || Array.isArray(v)) continue
      const k = String(key).slice(0, GIFT_BINDING_KEY_MAX)
      if (!k) continue
      out.giftBindings[k] = {
        assetId: String(v.assetId == null ? '' : v.assetId).slice(0, GIFT_ASSET_ID_MAX),
        position: GIFT_POSITIONS.includes(v.position) ? v.position : 'center',
        scale: giftNum(v.scale, 0.25, 2, 1),
        durationMs: Math.floor(giftNum(v.durationMs, 1000, 10000, 3000)),
        loop: v.loop === true,
      }
      n++
    }
  }

  const trigRaw = pick('giftTrigger')
  const trig = trigRaw && typeof trigRaw === 'object' && !Array.isArray(trigRaw) ? trigRaw : {}
  const trigMin = Math.floor(giftNum(trig.minMs, 1000, 3600000, d.giftTrigger.minMs))
  out.giftTrigger = {
    manual: trig.manual !== false,
    random: trig.random === true,
    probability: giftNum(trig.probability, 0, 1, d.giftTrigger.probability),
    minMs: trigMin,
    // An interval can never be inverted.
    maxMs: Math.floor(giftNum(trig.maxMs, trigMin, 3600000, Math.max(trigMin, d.giftTrigger.maxMs))),
  }

  out.giftMaxConcurrent = Math.floor(giftNum(pick('giftMaxConcurrent'), 1, 10, d.giftMaxConcurrent))
  out.giftShowSender = pick('giftShowSender') !== false

  const layoutRaw = pick('giftLayout')
  const layout = layoutRaw && typeof layoutRaw === 'object' && !Array.isArray(layoutRaw) ? layoutRaw : {}
  out.giftLayout = {
    roll: giftNum(layout.roll, 0, 100, d.giftLayout.roll),
    top: giftNum(layout.top, 0, 100, d.giftLayout.top),
    bottom: giftNum(layout.bottom, 0, 100, d.giftLayout.bottom),
  }

  out.giftMaxAssetMB = Math.floor(giftNum(pick('giftMaxAssetMB'), 1, 64, d.giftMaxAssetMB))
  return out
}

/** The gift keys owned by {@link clampGiftConfig} (index.js iterates these). */
export const GIFT_CONFIG_KEYS = GIFT_KEYS

// ---------------------------------------------------------------------------
// Gift CATALOG mapping (todo 2).
//
// Shared by `tools/fetch-gift-catalog.mjs` (which imports THIS file; tools/ is
// never shipped, and host code must never import tools/) and by the runtime
// catalog route (todo 5). Pure function: no I/O, never throws on malformed
// input — it always emits every key below with a present-or-null value.
//
// PRICE UNIT — the live API returns `price` in milli-元 (金瓜子 ÷ 1000); the
// deliberately-flattened offline sample `参考项目/giftfx/gifts.json` already
// stores 元. `priceUnit` selects the conversion so a mapped gift always carries
// 元 regardless of source. Keep this normalization: todo 5 and the catalog UI
// both render 元.
//
// PRIVACY — only the whitelisted fields below are ever read, so a raw object
// carrying `room_id`/`uid`/any other room identifier can never leak through.
// ---------------------------------------------------------------------------

/** Resource URL fields mirrored from the B 站 gift config. */
const CATALOG_RESOURCE_FIELDS = [
  'full_sc_web', 'full_sc_horizontal', 'full_sc_vertical',
  // The `*_svga` twins are the real animation bodies. They are kept alongside
  // the plain fields so a mapping never ends up with an empty resource set.
  'full_sc_horizontal_svga', 'full_sc_vertical_svga',
  'img_basic', 'img_dynamic', 'gif', 'webp',
]

/** Every key {@link mapCatalogGift} always emits (present-or-null). */
export const GIFT_CATALOG_FIELDS = [
  'id', 'name', 'price', 'coin_type', 'type', 'desc', 'effect_id',
  'frame_num', 'stay_time', 'combo_id',
  ...CATALOG_RESOURCE_FIELDS,
]

function catalogNum(v, def) {
  const n = Number(v)
  return Number.isFinite(n) ? n : def
}

function catalogUrl(g, files, key) {
  const v = g[key] != null ? g[key] : files[key]
  return typeof v === 'string' && v ? v : null
}

/**
 * Map one raw B 站 gift into the catalog shape. All
 * {@link GIFT_CATALOG_FIELDS} keys are always present; missing/blank values are
 * `null` so consumers (catalog route, UI) never have to guard for absent keys.
 *
 * @param {object} raw a live API gift, or an offline sample entry (the sample
 *   nests its resources under `files`).
 * @param {{priceUnit?: 'milli'|'yuan'}} [opts] `'milli'` (default) divides the
 *   API price by 1000; pass `'yuan'` for sources already denominated in 元.
 * @returns {object} the normalized gift catalog entry.
 */
export function mapCatalogGift(raw, { priceUnit = 'milli' } = {}) {
  const g = raw && typeof raw === 'object' ? raw : {}
  const files = g.files && typeof g.files === 'object' ? g.files : {}
  const num = (v) => (v == null ? null : catalogNum(v, null))
  const out = {
    id: g.id == null ? null : g.id,
    name: g.name == null || g.name === '' ? '(未命名)' : String(g.name),
    // API = milli-元 → ÷1000; sample = already 元.
    price: priceUnit === 'yuan' ? catalogNum(g.price, 0) : catalogNum(g.price, 0) / 1000,
    coin_type: g.coin_type == null ? null : String(g.coin_type),
    type: g.type == null ? null : g.type,
    desc: g.desc == null ? null : String(g.desc),
    effect_id: g.effect_id != null ? g.effect_id : (g.effectId != null ? g.effectId : null),
    frame_num: num(g.animation_frame_num != null ? g.animation_frame_num : (g.frame_num != null ? g.frame_num : g.frame_animation_num)),
    stay_time: num(g.stay_time),
    combo_id: num(g.combo_resources_id != null ? g.combo_resources_id : g.combo_id),
  }
  for (const k of CATALOG_RESOURCE_FIELDS) out[k] = catalogUrl(g, files, k)
  return out
}
