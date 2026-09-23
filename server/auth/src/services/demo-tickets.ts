import { randomUUID } from 'node:crypto'
import { WsTickets } from './ws-tickets'

// One process/replica, like the existing audio session limits.
export class DemoTickets {
  private tickets: WsTickets
  private attempts = new Map<string, { count: number; expires: number }>()
  private global = { count: 0, expires: 0 }
  constructor(private now = Date.now) { this.tickets = new WsTickets(now) }
  issue(source: string): string | null {
    const now = this.now()
    for (const [key, value] of this.attempts) if (value.expires <= now) this.attempts.delete(key)
    if (this.global.expires <= now) this.global = { count: 0, expires: now + 3600000 }
    const bucket = this.attempts.get(source) ?? { count: 0, expires: now + 3600000 }
    if (bucket.count >= 3 || this.global.count >= 20) return null
    bucket.count++
    this.global.count++
    this.attempts.set(source, bucket)
    return this.tickets.issue('demo', { authorization: randomUUID() })
  }
  consume(ticket: string): string | null {
    return this.tickets.consume(ticket, 'demo')?.authorization ?? null
  }
}
export const demoTickets = new DemoTickets()
