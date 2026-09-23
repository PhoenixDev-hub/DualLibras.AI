export type PendingTranscript = { segmentId: string; text: string; capturedAt: string }
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem' | 'length' | 'key'>

// Acknowledge only after the server confirms the immutable segment ID. Stored
// entries survive refresh and retries retain the ID even after a lost response.
export class TranscriptOutbox {
  private running: Promise<void> | null = null
  private readonly key: string
  private readonly listeners = new Set<() => void>()
  private readonly storage: Storage
  private readonly send: (entry: PendingTranscript) => Promise<void>

  constructor(storage: Storage, userId: string, lessonId: string, send: (entry: PendingTranscript) => Promise<void>) {
    this.storage = storage
    this.send = send
    this.key = `transcript-pending:${userId}:${lessonId}`
    // Fail before capture if storage is disabled; never silently discard data.
    this.storage.setItem(`${this.key}:probe`, '1')
    this.storage.removeItem(`${this.key}:probe`)
    this.read()
  }

  private read(): PendingTranscript[] {
    const entries: PendingTranscript[] = []
    for (let index = 0; index < this.storage.length; index++) {
      const key = this.storage.key(index)
      if (!key?.startsWith(this.key + ':entry:')) continue
      const raw = this.storage.getItem(key)
      if (!raw) continue
      const entry = JSON.parse(raw) as PendingTranscript
      if (!entry || typeof entry.segmentId !== 'string' || typeof entry.text !== 'string' || typeof entry.capturedAt !== 'string')
        throw new Error('Fila local inválida. Preserve os dados do navegador e procure suporte.')
      entries.push(entry)
    }
    return entries.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt) || a.segmentId.localeCompare(b.segmentId))
  }

  private changed() { this.listeners.forEach(listener => listener()) }

  get count() { return this.read().length }
  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  add(text: string, segmentId = crypto.randomUUID(), capturedAt = new Date().toISOString()) {
    const key = `${this.key}:entry:${segmentId}`
    if (!this.storage.getItem(key)) {
      this.storage.setItem(key, JSON.stringify({ segmentId, text, capturedAt }))
      this.changed()
    }
  }

  flush(): Promise<void> {
    if (this.running) return this.running
    this.running = (async () => {
      while (true) {
        const entry = this.read()[0]
        if (!entry) return
        await this.send(entry)
        // One key per immutable entry: concurrent tabs cannot overwrite additions.
        this.storage.removeItem(`${this.key}:entry:${entry.segmentId}`)
        this.changed()
      }
    })().finally(() => { this.running = null })
    return this.running
  }
}
