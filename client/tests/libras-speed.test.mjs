import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(
  new URL('../src/features/libras/utils/playbackSpeed.ts', import.meta.url),
  'utf8',
)
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText
const { applyPlaybackSpeed } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
)

test('uses the current player API once with the selected speed', () => {
  const calls = []
  const current = {
    setSpeed(speed) {
      assert.equal(this, current)
      calls.push(speed)
    },
  }
  const legacy = {
    setSpeed() {
      assert.fail('must not send duplicate commands')
    },
  }
  assert.equal(applyPlaybackSpeed({ vlibras: current, plugin: { player: legacy } }, 1), true)
  applyPlaybackSpeed({ vlibras: current }, 1.25)
  applyPlaybackSpeed({ vlibras: current }, 1.25)
  assert.deepEqual(calls, [1, 1.25, 1.25])
})

test('supports the legacy player and retries when no speed API has loaded', () => {
  assert.equal(applyPlaybackSpeed({}, 1), false)
  let chosen
  const player = {
    setSpeed(speed) {
      chosen = speed
    },
  }
  assert.equal(applyPlaybackSpeed({ plugin: { player } }, 1.5), true)
  assert.equal(chosen, 1.5)
})
