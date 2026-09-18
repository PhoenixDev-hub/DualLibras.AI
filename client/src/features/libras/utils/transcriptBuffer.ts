// Accumulate revisions of a streaming transcript and enqueue only its new words.
// Final messages flush immediately; callers may also flush partials periodically.
export class TranscriptBuffer {
  private text = ''
  private sent: string[] = []

  update(text: string) {
    this.text = text.trim().replace(/\s+/g, ' ')
  }

  flush(final = false): string {
    const words = this.text.split(' ').filter(Boolean)
    const normalized = words.map((word) => word.toLocaleLowerCase('pt-BR').replace(/[.,!?;:]/g, ''))
    // A new utterance can arrive without a final marker from older backends.
    const continues = this.sent.every((word, index) => normalized[index] === word)
    const next = words.slice(continues ? this.sent.length : 0).join(' ')
    this.sent = normalized
    if (final) this.reset()
    return next
  }

  reset() {
    this.text = ''
    this.sent = []
  }
}
