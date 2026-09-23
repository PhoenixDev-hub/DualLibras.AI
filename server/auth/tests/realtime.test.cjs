const { test } = require('node:test')
const assert = require('node:assert/strict')
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = 'realtime-test-only-secret'
process.env.AI_INTERNAL_TOKEN = 'realtime-internal-test-only'
process.env.DOTENV_CONFIG_QUIET = 'true'
const { createApp } = require('../dist/app')
const { prisma } = require('../dist/config/prisma')
const { signToken } = require('../dist/utils/jwt')

test('only authenticated teachers issue tickets; only internal service can consume them', async t => {
  const server = createApp().listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  t.after(() => prisma.$disconnect())
  let role = 'PROFESSOR'
  prisma.user.findFirst = async () => ({ id: 'teacher', role, isActive: true, sessionVersion: 0 })
  const token = signToken({ sub: 'teacher', email: 'teacher@example.com', version: 0 })
  const base = `http://127.0.0.1:${server.address().port}`
  const lessonId = '00000000-0000-4000-8000-000000000001'
  const post = (path, body, headers = {}) => fetch(base + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  })
  assert.equal((await post('/realtime/ticket', { lessonId })).status, 401)
  const session = { Authorization: `Bearer ${token}` }
  role = 'ALUNO'
  assert.equal((await post('/realtime/ticket', { lessonId }, session)).status, 403)
  role = 'PROFESSOR'
  const response = await post('/realtime/ticket', { lessonId }, session)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const { ticket } = await response.json()
  assert.equal((await post('/internal/ai/ws-session', { ticket, lessonId })).status, 403)
  const internal = { 'X-AI-Internal-Token': process.env.AI_INTERNAL_TOKEN }
  const exchange = await post('/internal/ai/ws-session', { ticket, lessonId }, internal)
  assert.equal(exchange.status, 200)
  assert.deepEqual(await exchange.json(), { authorization: `Bearer ${token}` })
  assert.equal((await post('/internal/ai/ws-session', { ticket, lessonId }, internal)).status, 401)
})
