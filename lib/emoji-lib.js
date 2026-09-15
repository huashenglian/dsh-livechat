/**
 * Emoji library storage + streaming import (git / zip / images).
 * Files live under $DSH_HOME/danmaku-emojis/files/
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync, rmSync, copyFileSync, statSync } from 'node:fs'
import { join, dirname, basename, extname, relative, sep } from 'node:path'
import { homedir } from 'node:os'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp'])

export function emojiDir() {
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  return join(home, 'danmaku-emojis')
}

export function emojiFilesDir() {
  return join(emojiDir(), 'files')
}

export function emojiManifestPath() {
  return join(emojiDir(), 'manifest.json')
}

function emptyManifest() {
  return { version: 2, folders: [], items: [] }
}

export function loadEmojiManifest() {
  try {
    if (existsSync(emojiManifestPath())) {
      const raw = JSON.parse(readFileSync(emojiManifestPath(), 'utf8'))
      if (raw && Array.isArray(raw.items)) {
        return {
          version: 2,
          folders: Array.isArray(raw.folders) ? raw.folders : [],
          items: raw.items,
        }
      }
    }
  } catch {
    /* ignore */
  }
  return emptyManifest()
}

export function saveEmojiManifest(m) {
  try {
    mkdirSync(emojiDir(), { recursive: true })
    writeFileSync(emojiManifestPath(), JSON.stringify(m, null, 2), 'utf8')
    return true
  } catch {
    return false
  }
}

export function clearEmojiCache() {
  try {
    abortImport()
    const dir = emojiDir()
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
}

export function publicUrl(id) {
  return '/api/danmaku/emojis/image?id=' + encodeURIComponent(id)
}

export function toPublicItem(it) {
  return {
    id: it.id,
    name: it.name,
    weight: Number(it.weight) || 0,
    folderId: it.folderId || null,
    url: publicUrl(it.id),
  }
}

export function toPublicFolder(f) {
  return { id: f.id, name: f.name, parentId: f.parentId || null }
}

function uid(prefix) {
  return prefix + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

function ensureDirs() {
  mkdirSync(emojiFilesDir(), { recursive: true })
}

function removeFile(file) {
  try {
    const p = join(emojiFilesDir(), file)
    if (existsSync(p)) unlinkSync(p)
  } catch {
    /* ignore */
  }
}

function countDescendants(manifest, folderId) {
  let folders = 0
  let items = 0
  const walk = (id) => {
    for (const it of manifest.items) {
      if ((it.folderId || null) === id) items++
    }
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

export function createFolder(name, parentId) {
  const manifest = loadEmojiManifest()
  const id = uid('f_')
  const folder = {
    id,
    name: String(name || '新建文件夹').slice(0, 40),
    parentId: parentId || null,
  }
  manifest.folders.push(folder)
  saveEmojiManifest(manifest)
  return toPublicFolder(folder)
}

export function renameFolder(id, name) {
  const manifest = loadEmojiManifest()
  const f = manifest.folders.find((x) => x.id === id)
  if (!f) return { ok: false, reason: 'not_found' }
  f.name = String(name || f.name).slice(0, 40)
  saveEmojiManifest(manifest)
  return { ok: true, folder: toPublicFolder(f) }
}

/** Delete folder. force=true removes nested folders + items. */
export function deleteFolder(id, force) {
  const manifest = loadEmojiManifest()
  const f = manifest.folders.find((x) => x.id === id)
  if (!f) return { ok: false, reason: 'not_found' }
  const nested = countDescendants(manifest, id)
  if ((nested.folders > 0 || nested.items > 0) && !force) {
    return { ok: false, reason: 'not_empty', folders: nested.folders, items: nested.items }
  }
  const doomedFiles = []
  const doomedFolders = new Set([id])
  const walk = (fid) => {
    for (const it of manifest.items) {
      if ((it.folderId || null) === fid) doomedFiles.push(it.file)
    }
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
  saveEmojiManifest(manifest)
  for (const file of doomedFiles) removeFile(file)
  return { ok: true, removedFolders: doomedFolders.size, removedItems: doomedFiles.length }
}

export function moveItems(itemIds, folderId) {
  const manifest = loadEmojiManifest()
  let n = 0
  for (const id of itemIds || []) {
    const it = manifest.items.find((x) => x.id === id)
    if (it) {
      it.folderId = folderId || null
      n++
    }
  }
  saveEmojiManifest(manifest)
  return { ok: true, moved: n }
}

export function deleteItems(ids) {
  const manifest = loadEmojiManifest()
  const set = new Set(ids || [])
  const doomed = manifest.items.filter((x) => set.has(x.id))
  manifest.items = manifest.items.filter((x) => !set.has(x.id))
  saveEmojiManifest(manifest)
  for (const it of doomed) removeFile(it.file)
  return { ok: true, removed: doomed.length }
}

export function setItemWeight(id, weight) {
  const manifest = loadEmojiManifest()
  const it = manifest.items.find((x) => x.id === id)
  if (!it) return { ok: false, reason: 'not_found' }
  it.weight = Math.max(0, Number(weight) || 0)
  saveEmojiManifest(manifest)
  return { ok: true, weight: it.weight }
}

export function clearAllEmoji() {
  clearEmojiCache()
  ensureDirs()
  saveEmojiManifest(emptyManifest())
  return { ok: true }
}

/** Add one image buffer into library. */
export function addImageBuffer({ name, buffer, folderId, weight, ext }) {
  if (!buffer || !buffer.length) return null
  ensureDirs()
  let e = String(ext || extname(name || '') || '.png').toLowerCase()
  if (!e.startsWith('.')) e = '.' + e
  if (!IMG_EXT.has(e)) e = '.png'
  const id = uid('e_')
  const file = id + e
  writeFileSync(join(emojiFilesDir(), file), buffer)
  const manifest = loadEmojiManifest()
  const item = {
    id,
    name: String(name || 'emoji').slice(0, 40),
    file,
    weight: Number(weight) || 1,
    folderId: folderId || null,
  }
  manifest.items.push(item)
  saveEmojiManifest(manifest)
  return toPublicItem(item)
}

export function imagePath(id) {
  const manifest = loadEmojiManifest()
  const it = manifest.items.find((x) => x.id === id)
  if (!it || !it.file) return null
  const p = join(emojiFilesDir(), it.file)
  return existsSync(p) ? p : null
}

export function listLibrary() {
  const m = loadEmojiManifest()
  return {
    folders: m.folders.map(toPublicFolder),
    items: m.items.map(toPublicItem),
  }
}

function walkImages(root) {
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
      else if (IMG_EXT.has(extname(ent.name).toLowerCase())) out.push(p)
    }
  }
  walk(root)
  return out
}

function relFolders(root, filePath) {
  const rel = relative(root, dirname(filePath))
  if (!rel || rel === '.') return []
  return rel.split(/[\\/]/).filter(Boolean)
}

// ---- import jobs ----
let currentJob = null
let abortFlag = false

export function abortImport() {
  abortFlag = true
  if (currentJob) currentJob.aborted = true
}

export function getImportStatus() {
  if (!currentJob) return { running: false }
  return {
    running: !!currentJob.running,
    id: currentJob.id,
    type: currentJob.type,
    done: currentJob.done,
    total: currentJob.total,
    current: currentJob.current,
    error: currentJob.error || null,
    aborted: !!currentJob.aborted,
    limit: currentJob.limit,
    folderId: currentJob.folderId || null,
  }
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

async function copyImagesStream({ root, job, parentFolderId, limit }) {
  const files = walkImages(root)
  job.total = files.length
  const manifest = loadEmojiManifest()
  // pre-create top-level folders for nicer live view
  const topNames = new Set()
  for (const f of files) {
    const parts = relFolders(root, f)
    if (parts.length) topNames.add(parts[0])
  }
  for (const name of topNames) {
    ensureFolderChain(manifest, parentFolderId, [name])
  }
  saveEmojiManifest(manifest)

  const concurrency = 4
  let idx = 0
  const workers = []
  const runOne = async (filePath) => {
    if (abortFlag || job.aborted) return
    if (limit > 0 && job.done >= limit) return
    const parts = relFolders(root, filePath)
    const name = basename(filePath).slice(0, 40)
    job.current = parts.length ? parts.join('/') + '/' + name : name
    try {
      const buffer = readFileSync(filePath)
      const ext = extname(filePath).toLowerCase()
      const m = loadEmojiManifest()
      const folderId = parts.length ? ensureFolderChain(m, parentFolderId, parts) : (parentFolderId || null)
      saveEmojiManifest(m)
      const item = addImageBuffer({ name, buffer, folderId, weight: 1, ext })
      if (item) job.done++
    } catch {
      /* skip bad file */
    }
  }
  const worker = async () => {
    while (idx < files.length && !abortFlag && !job.aborted) {
      if (limit > 0 && job.done >= limit) break
      const my = idx++
      await runOne(files[my])
    }
  }
  for (let i = 0; i < concurrency; i++) workers.push(worker())
  await Promise.all(workers)
}

function runGit(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      cwd,
      windowsHide: true,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: 'echo' },
    })
    let err = ''
    p.stderr.on('data', (d) => { err += String(d) })
    p.on('error', reject)
    p.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(err || ('exit ' + code)))
    })
  })
}

function parseGithubRepo(url) {
  const s = String(url || '').trim()
  let m = s.match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?(?:\/.*)?$/i)
  if (m) return { owner: m[1], repo: m[2].replace(/\.git$/i, '') }
  m = s.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/i)
  if (m) return { owner: m[1], repo: m[2].replace(/\.git$/i, '') }
  return null
}

function curlGetBuffer(url, timeoutSec) {
  return new Promise((resolve, reject) => {
    const outFile = join(tmpdir(), 'dsh-curl-' + uid('c_'))
    const p = spawn('curl.exe', [
      '-sL',
      '-A', 'dsh-livechat',
      '--max-time', String(timeoutSec || 90),
      '-o', outFile,
      url,
    ], { windowsHide: true })
    const errChunks = []
    p.stderr.on('data', (d) => errChunks.push(d))
    p.on('error', reject)
    p.on('close', (code) => {
      try {
        if (code === 0 && existsSync(outFile)) {
          const buf = readFileSync(outFile)
          resolve(buf)
        } else {
          reject(new Error(Buffer.concat(errChunks).toString() || ('curl exit ' + code)))
        }
      } catch (e) {
        reject(e)
      } finally {
        try { unlinkSync(outFile) } catch { /* ignore */ }
      }
    })
  })
}

async function fetchJsonUrl(url) {
  const buf = await curlGetBuffer(url, 60)
  return JSON.parse(buf.toString('utf8'))
}

async function listGithubImages(owner, repo) {
  const meta = JSON.parse((await curlGetBuffer(`https://api.github.com/repos/${owner}/${repo}`, 60)).toString('utf8'))
  const branch = meta.default_branch || 'master'
  const tree = JSON.parse((await curlGetBuffer(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    120,
  )).toString('utf8'))
  const paths = (tree.tree || [])
    .filter((n) => n.type === 'blob' && IMG_EXT.has(extname(n.path || '').toLowerCase()))
    .map((n) => n.path)
  return { branch, paths }
}

async function downloadGithubFile(owner, repo, branch, path) {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path.split('/').map(encodeURIComponent).join('/')}`
  return curlGetBuffer(url, 60)
}

async function importPathList({ owner, repo, branch, files, job, parentFolderId, limit }) {
  job.total = files.length
  const concurrency = 4
  let idx = 0
  const workers = []
  const runOne = async (rel) => {
    if (abortFlag || job.aborted) return
    if (limit > 0 && job.done >= limit) return
    const parts = rel.split('/')
    const name = parts[parts.length - 1]
    const dirs = parts.slice(0, -1)
    job.current = rel
    try {
      const buffer = await downloadGithubFile(owner, repo, branch, rel)
      if (limit > 0 && job.done >= limit) return
      const ext = extname(rel).toLowerCase()
      const m = loadEmojiManifest()
      const folderId = dirs.length ? ensureFolderChain(m, parentFolderId, dirs) : (parentFolderId || null)
      saveEmojiManifest(m)
      const item = addImageBuffer({ name, buffer, folderId, weight: 1, ext })
      if (item) {
        job.done++
        if (limit > 0 && job.done > limit) {
          deleteItems([item.id])
          job.done = limit
        }
      }
    } catch {
      /* skip */
    }
  }
  const worker = async () => {
    while (idx < files.length && !abortFlag && !job.aborted) {
      if (limit > 0 && job.done >= limit) break
      const my = idx++
      await runOne(files[my])
    }
  }
  for (let i = 0; i < concurrency; i++) workers.push(worker())
  await Promise.all(workers)
}

/** Start streaming git import (GitHub API preferred for large repos). */
export async function startGitImport({ url, folderId, limit }) {
  if (currentJob && currentJob.running) {
    return { ok: false, reason: 'busy' }
  }
  abortFlag = false
  const job = {
    id: uid('j_'),
    type: 'git',
    running: true,
    aborted: false,
    done: 0,
    total: 0,
    current: 'listing…',
    error: null,
    limit: Number(limit) > 0 ? Number(limit) : 0,
    folderId: folderId || null,
  }
  currentJob = job
  const repoUrl = String(url || '').trim()
  try {
    const gh = parseGithubRepo(repoUrl)
    if (gh) {
      const { branch, paths } = await listGithubImages(gh.owner, gh.repo)
      if (abortFlag || job.aborted) {
        job.running = false
        return { ok: true, job: getImportStatus() }
      }
      await importPathList({
        owner: gh.owner,
        repo: gh.repo,
        branch,
        files: paths,
        job,
        parentFolderId: folderId,
        limit: job.limit,
      })
    } else {
      if (!/^https?:\/\/|^git@/i.test(repoUrl)) throw new Error('invalid git url')
      const tmp = join(tmpdir(), 'dsh-emo-git-' + job.id)
      mkdirSync(tmp, { recursive: true })
      await runGit('git', ['clone', '--depth', '1', '--filter=blob:none', repoUrl, tmp], tmpdir())
      await copyImagesStream({ root: tmp, job, parentFolderId: folderId, limit: job.limit })
      try { rmSync(tmp, { recursive: true, force: true }) } catch { /* ignore */ }
    }
  } catch (e) {
    job.error = String(e && e.message ? e.message : e)
  } finally {
    job.running = false
    job.current = ''
  }
  return { ok: !job.error, job: getImportStatus() }
}

/** Unzip via PowerShell Expand-Archive then stream-import. */
export async function startZipImport({ zipPath, folderId, limit }) {
  if (currentJob && currentJob.running) return { ok: false, reason: 'busy' }
  abortFlag = false
  const job = {
    id: uid('j_'),
    type: 'zip',
    running: true,
    aborted: false,
    done: 0,
    total: 0,
    current: '',
    error: null,
    limit: Number(limit) > 0 ? Number(limit) : 0,
    folderId: folderId || null,
  }
  currentJob = job
  const outDir = join(tmpdir(), 'dsh-emo-zip-' + job.id)
  try {
    mkdirSync(outDir, { recursive: true })
    await new Promise((resolve, reject) => {
      const p = spawn('powershell', [
        '-NoProfile',
        '-Command',
        `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${outDir.replace(/'/g, "''")}' -Force`,
      ], { windowsHide: true })
      let err = ''
      p.stderr.on('data', (d) => { err += String(d) })
      p.on('error', reject)
      p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err || 'unzip failed'))))
    })
    // If zip contains a single root folder, use its inner content as root
    let root = outDir
    try {
      const ents = readdirSync(outDir, { withFileTypes: true }).filter((e) => !e.name.startsWith('.'))
      if (ents.length === 1 && ents[0].isDirectory()) root = join(outDir, ents[0].name)
    } catch { /* ignore */ }
    await copyImagesStream({ root, job, parentFolderId: folderId, limit: job.limit })
  } catch (e) {
    job.error = String(e && e.message ? e.message : e)
  } finally {
    job.running = false
    try { rmSync(outDir, { recursive: true, force: true }) } catch { /* ignore */ }
    try { if (zipPath && existsSync(zipPath)) unlinkSync(zipPath) } catch { /* ignore */ }
  }
  return { ok: !job.error, job: getImportStatus() }
}

/** Persist a zip buffer to temp and start import. */
export async function startZipBufferImport({ buffer, folderId, limit, name }) {
  ensureDirs()
  const zipPath = join(tmpdir(), 'dsh-emo-upload-' + uid('z_') + '.zip')
  writeFileSync(zipPath, buffer)
  return startZipImport({ zipPath, folderId, limit, name })
}
