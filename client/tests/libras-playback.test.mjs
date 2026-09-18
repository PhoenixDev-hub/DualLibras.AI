import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(
  new URL('../src/features/libras/utils/playback.ts', import.meta.url),
  'utf8',
)
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText
const { playUntilFinished } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
)
const tick = () => new Promise((resolve) => setTimeout(resolve, 65))

test('current player waits for playing → idle, not the translation HTTP response', async () => {
  let state = { status: 'idle' }
  let complete = false
  const done = playUntilFinished(
    async () => {},
    () => state,
    new AbortController().signal,
  ).then(() => {
    complete = true
  })
  await tick()
  assert.equal(complete, false)
  state = { status: 'playing' }
  await tick()
  state = { status: 'paused' }
  await tick()
  assert.equal(complete, false)
  state = { status: 'playing' }
  await tick()
  state = { status: 'idle' }
  await done
  assert.equal(complete, true)
})

test('legacy player ignores initial stop and advances the queue only after playback ends', async () => {
  const player = new EventEmitter()
  const played = []
  const signal = new AbortController().signal
  const run = async () => {
    for (const phrase of ['Olá! Bem-vindo ao DualLibras.AI.', 'Bom dia turma.', 'Bom dia turma.']) {
      await playUntilFinished(
        () => {
          played.push(phrase)
          player.emit('animation:end')
        },
        () => player,
        signal,
      )
    }
  }
  const done = run()
  await tick()
  assert.equal(played.length, 1)
  for (let count = 1; count <= 3; count++) {
    player.emit('animation:play')
    player.emit('animation:end')
    await tick()
    assert.equal(played.length, Math.min(count + 1, 3))
  }
  await done
  assert.equal(played.filter((text) => text.startsWith('Olá')).length, 1)
  assert.equal(player.listenerCount('animation:end'), 0)
})

test('missing completion fails instead of authorizing the next phrase', async () => {
  await assert.rejects(
    playUntilFinished(
      () => {},
      () => ({ status: 'idle' }),
      new AbortController().signal,
      30,
    ),
    /não confirmou/,
  )
})

test('translation rejection and unmount clean up listeners', async () => {
  const player = new EventEmitter()
  await assert.rejects(
    playUntilFinished(
      () => Promise.reject(new Error('offline')),
      () => player,
      new AbortController().signal,
    ),
    /offline/,
  )
  const controller = new AbortController()
  const done = playUntilFinished(
    () => {},
    () => player,
    controller.signal,
  )
  controller.abort()
  await assert.rejects(done, { name: 'AbortError' })
  assert.equal(player.listenerCount('animation:play'), 0)
  assert.equal(player.listenerCount('error'), 0)
})

test('a previous animation ending during the HTTP request does not finish the new phrase', async () => {
  let releaseTranslation
  let state = { status: 'playing' }
  let complete = false
  const response = new Promise((resolve) => {
    releaseTranslation = resolve
  })
  const done = playUntilFinished(
    () => response,
    () => state,
    new AbortController().signal,
  ).then(() => {
    complete = true
  })
  await tick()
  state = { status: 'idle' }
  await tick()
  releaseTranslation()
  await tick()
  assert.equal(complete, false)
  state = { status: 'playing' }
  await tick()
  state = { status: 'idle' }
  await done
})
