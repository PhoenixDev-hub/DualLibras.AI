import { randomBytes } from 'node:crypto'

type SessionHeaders = { cookie?: string; authorization?: string }
export class WsTickets {
  private entries = new Map<string, { lessonId: string; headers: SessionHeaders; expires: number }>()
  constructor(private now = Date.now) {}
  issue(lessonId: string, headers: SessionHeaders): string {
    for (const [key, value] of this.entries) if (value.expires <= this.now()) this.entries.delete(key)
    if (this.entries.size >= 10000) throw new Error('Limite de tickets atingido')
    const ticket = randomBytes(32).toString('hex')
    this.entries.set(ticket, { lessonId, headers: { ...headers }, expires: this.now() + 60000 })
    return ticket
  }
  consume(ticket: string, lessonId: string): SessionHeaders | null {
    const entry = this.entries.get(ticket)
    this.entries.delete(ticket)
    if (!entry || entry.expires <= this.now() || entry.lessonId !== lessonId) return null
    return entry.headers
  }
}
export const wsTickets = new WsTickets()
