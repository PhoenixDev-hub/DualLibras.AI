import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(
  new URL('../src/features/libras/utils/nextUtterance.ts', import.meta.url),
  'utf8',
)
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText
const { takeNextUtterance } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
)

test('greeting stays separate and waiting fragments are translated together in order', () => {
  const queue = [
    { id: 0, text: 'Olá!' },
    { id: 1, text: 'Hoje vamos' },
    { id: 2, text: 'estudar matemática.' },
  ]
  assert.deepEqual(takeNextUtterance(queue), { id: 0, text: 'Olá!' })
  assert.deepEqual(takeNextUtterance(queue), { id: 2, text: 'Hoje vamos estudar matemática.' })
  assert.equal(queue.length, 0)
})

test('batch limit preserves remaining content and the final acknowledgment id', () => {
  const queue = [
    { id: 1, text: 'um dois' },
    { id: 2, text: 'três' },
    { id: 3, text: 'quatro cinco' },
  ]
  assert.deepEqual(takeNextUtterance(queue, 3), { id: 2, text: 'um dois três' })
  assert.deepEqual(takeNextUtterance(queue, 3), { id: 3, text: 'quatro cinco' })
  assert.equal(takeNextUtterance(queue), undefined)
})
