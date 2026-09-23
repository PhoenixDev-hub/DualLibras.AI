const { test } = require('node:test')
const assert = require('node:assert/strict')
const { WsTickets } = require('../dist/services/ws-tickets')

test('WebSocket ticket is opaque, scoped to a lesson and single use', () => {
  const tickets = new WsTickets()
  const headers = { cookie: 'festival_session=private' }
  const ticket = tickets.issue('lesson-a', headers)
  assert.match(ticket, /^[a-f0-9]{64}$/)
  assert.equal(ticket.includes('private'), false)
  assert.deepEqual(tickets.consume(ticket, 'lesson-a'), headers)
  assert.equal(tickets.consume(ticket, 'lesson-a'), null)
  const wrongLesson = tickets.issue('lesson-a', headers)
  assert.equal(tickets.consume(wrongLesson, 'lesson-b'), null)
  assert.equal(tickets.consume('unknown', 'lesson-a'), null)
})

test('WebSocket ticket expires after 60 seconds without extending the session', () => {
  let now = 0
  const tickets = new WsTickets(() => now)
  const ticket = tickets.issue('lesson-a', { authorization: 'Bearer original-session' })
  now = 60000
  assert.equal(tickets.consume(ticket, 'lesson-a'), null)
})
