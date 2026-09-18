import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(
  new URL('../src/features/libras/utils/transcriptBuffer.ts', import.meta.url),
  'utf8',
)
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText
const { TranscriptBuffer } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
)

test('partial speech is delivered even without a final marker', () => {
  const buffer = new TranscriptBuffer()
  buffer.update('bom dia')
  assert.equal(buffer.flush(), 'bom dia')
  buffer.update('bom dia turma')
  assert.equal(buffer.flush(), 'turma')
  buffer.update('Bom dia turma.')
  assert.equal(buffer.flush(true), '')
})

test('revisions are coalesced before sending and final messages flush the remainder', () => {
  const buffer = new TranscriptBuffer()
  buffer.update('hoje vamos estudar geografia')
  buffer.update('hoje vamos estudar matemática')
  assert.equal(buffer.flush(), 'hoje vamos estudar matemática')
  buffer.update('Hoje vamos estudar matemática e física.')
  assert.equal(buffer.flush(true), 'e física.')
  buffer.update('Hoje vamos estudar matemática e física.')
  assert.equal(buffer.flush(true), 'Hoje vamos estudar matemática e física.')
})

test('a new sentence without a preceding final marker still reaches the avatar', () => {
  const buffer = new TranscriptBuffer()
  buffer.update('Bom dia turma.')
  assert.equal(buffer.flush(), 'Bom dia turma.')
  buffer.update('Vamos começar a aula.')
  assert.equal(buffer.flush(), 'Vamos começar a aula.')
})
