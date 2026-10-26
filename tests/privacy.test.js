// 0.6.14: the danmaku LLM must never READ a credential. Redaction happens at
// ingestion and again when the prompt is assembled, so these tests cover both
// layers: `redactSecrets` alone, and a full `buildLlmPrompt` built from lines
// that still contain secrets (defence in depth).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { redactSecrets, buildLlmPrompt } from '../lib/index.js'

const MASK = '［已隐藏］'

test('masks vendor-shaped API keys', () => {
  const raw = '把 sk-proj-abcdefghijklmnop1234567890 填进去'
  const out = redactSecrets(raw)
  assert.ok(!out.includes('sk-proj-abcdefghijklmnop1234567890'), out)
  assert.ok(out.includes(MASK), out)
  assert.ok(out.startsWith('把 '), 'surrounding Chinese text survives: ' + out)
})

test('masks label=value credentials (ASCII and Chinese labels)', () => {
  const ascii = redactSecrets('config: apiKey = "abcd1234efgh" done')
  assert.ok(!ascii.includes('abcd1234efgh'), ascii)
  assert.ok(ascii.includes('config'), ascii)

  const zh = redactSecrets('我的密码：hunter2xyz 记住了')
  assert.ok(!zh.includes('hunter2xyz'), zh)
  assert.ok(zh.includes('记住了'), zh)
})

test('masks PEM private-key blocks whole', () => {
  const raw = '-----BEGIN RSA PRIVATE KEY-----\nMIIEow\nAAAA\n-----END RSA PRIVATE KEY-----'
  const out = redactSecrets(raw)
  assert.equal(out, MASK)
})

test('masks the OS account name in home paths', () => {
  assert.ok(!redactSecrets('C:\\Users\\alice\\secret.txt').includes('alice'))
  assert.ok(!redactSecrets('/home/alice/project/x.js').includes('alice'))
})

test('leaves ordinary danmaku text alone (idempotent)', () => {
  const raw = '这段代码好优雅，学到了 👍'
  assert.equal(redactSecrets(raw), raw)
  assert.equal(redactSecrets(redactSecrets(raw)), raw)
})

test('buildLlmPrompt never contains a raw secret from any field', () => {
  const cfg = {
    stylePrompt: '吐槽',
    llmBurstCount: 2,
    styleMaxChars: 24,
    thinkingExcerptChars: 240,
    contextSources: { conversation: true, thinking: true, warning: true, usage: true, tools: true, events: true },
  }
  const prompt = buildLlmPrompt(
    cfg,
    ['用户：这是我的 key sk-abcdefghijklmnopqrstuvwx', '好的，已收到 token=abcd1234efgh'],
    ['user_message'],
    {
      thinking: '用 ghp_0123456789abcdefghijklmnopqrstuvwx 调接口',
      warning: 'password: hunter2xyz 认证失败',
      usage: '输入 1KTok',
      tools: 'read',
    },
  )
  for (const secret of ['sk-abcdefghijklmnopqrstuvwx', 'abcd1234efgh', 'ghp_0123456789abcdefghijklmnopqrstuvwx', 'hunter2xyz']) {
    assert.ok(!prompt.includes(secret), `prompt leaked ${secret}:\n${prompt}`)
  }
  assert.ok(prompt.includes('输入 1KTok'), 'harmless context survives')
})
