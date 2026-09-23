import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const source = readFileSync(new URL('../src/services/pendingRequests.ts', import.meta.url), 'utf8')
const exports = {}
vm.runInNewContext(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports },
)
const { PendingRequests } = exports

test('concurrent identical reads share work, completed data is never cached', async () => {
  const requests = new PendingRequests()
  let finish,
    calls = 0
  const read = () => {
    calls++
    return new Promise((resolve) => {
      finish = resolve
    })
  }
  const first = requests.run('/education', read)
  const second = requests.run('/education', read)
  assert.equal(calls, 1)
  finish({ value: 1 })
  assert.equal(await first, await second)
  await requests.run('/education', async () => {
    calls++
    return 2
  })
  assert.equal(calls, 2)
})
test('mutation/session invalidation isolates new reads even if old requests finish later', async () => {
  const requests = new PendingRequests()
  let oldFinish, newFinish
  const old = requests.run(
    '/education',
    () =>
      new Promise((resolve) => {
        oldFinish = resolve
      }),
  )
  requests.clear()
  const fresh = requests.run(
    '/education',
    () =>
      new Promise((resolve) => {
        newFinish = resolve
      }),
  )
  oldFinish('previous session')
  await old
  const shared = requests.run('/education', () => {
    throw new Error('duplicate read')
  })
  newFinish('current session')
  assert.equal(await fresh, 'current session')
  assert.equal(await shared, 'current session')
})
test('failed reads are removed and different resources remain independent', async () => {
  const requests = new PendingRequests()
  await assert.rejects(
    requests.run('/education', async () => {
      throw new Error('offline')
    }),
  )
  assert.equal(await requests.run('/education', async () => 42), 42)
  assert.deepEqual(
    await Promise.all([requests.run('/a', async () => 'a'), requests.run('/b', async () => 'b')]),
    ['a', 'b'],
  )
})
