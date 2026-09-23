const { test } = require('node:test')
const assert = require('node:assert/strict')
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = 'demo-test-only-secret'
process.env.AI_INTERNAL_TOKEN = 'demo-internal-test-only'
process.env.CORS_ORIGIN = 'http://localhost:5173'
process.env.DOTENV_CONFIG_QUIET = 'true'
const { DemoTickets } = require('../dist/services/demo-tickets')
const { createApp } = require('../dist/app')
const { prisma } = require('../dist/config/prisma')

test('anonymous tickets have per-source and global hourly limits, expiry and single use', () => {
  let now = 0
  const tickets = new DemoTickets(() => now)
  const first = tickets.issue('source-a')
  assert.match(tickets.consume(first), /^[a-f0-9-]{36}$/)
  assert.equal(tickets.consume(first), null)
  const expired = tickets.issue('source-a')
  tickets.issue('source-a')
  assert.equal(tickets.issue('source-a'), null)
  now = 60000
  assert.equal(tickets.consume(expired), null)
  for (let i = 0; i < 17; i++) assert.ok(tickets.issue(`source-${i}`))
  assert.equal(tickets.issue('another-source'), null)
  now = 3600000
  assert.ok(tickets.issue('source-a'))
})

test('demo issues no login session, denies lesson scope and only exchanges internally', async t => {
  const server = createApp().listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  t.after(() => prisma.$disconnect())
  const base = `http://127.0.0.1:${server.address().port}`
  const post = (path, body, headers = {}) => fetch(base + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  })
  const origin = { Origin: 'http://localhost:5173' }
  const internal = { 'X-AI-Internal-Token': process.env.AI_INTERNAL_TOKEN }
  assert.equal((await post('/realtime/demo-ticket', {})).status, 403)
  assert.equal((await post('/realtime/demo-ticket', {}, { Origin: 'https://other.example' })).status, 403)
  assert.equal((await post('/realtime/demo-ticket', { lessonId: 'any' }, origin)).status, 400)
  const response = await post('/realtime/demo-ticket', {}, origin)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('set-cookie'), null)
  const { ticket, maxSeconds } = await response.json()
  assert.equal(maxSeconds, 60)
  assert.equal((await fetch(base + '/users/me', { headers: { Authorization: `Bearer ${ticket}` } })).status, 401)
  assert.equal((await post('/internal/ai/ws-session', { ticket, lessonId: '00000000-0000-4000-8000-000000000001' }, internal)).status, 401)
  assert.equal((await post('/internal/ai/demo-session', { ticket })).status, 403)
  const exchange = await post('/internal/ai/demo-session', { ticket }, internal)
  assert.equal(exchange.status, 200)
  assert.deepEqual(Object.keys(await exchange.json()), ['visitorId'])
  assert.equal((await post('/internal/ai/demo-session', { ticket }, internal)).status, 401)
  for (let i = 0; i < 2; i++) assert.equal((await post('/realtime/demo-ticket', {}, origin)).status, 200)
  assert.equal((await post('/realtime/demo-ticket', {}, origin)).status, 429)
})
