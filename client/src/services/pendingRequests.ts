/** Share only running reads. Never retain results or share across a mutation/session change. */
export class PendingRequests {
  private readonly requests = new Map<string, Promise<unknown>>()

  clear() {
    this.requests.clear()
  }

  run<T>(key: string, read: () => Promise<T>): Promise<T> {
    const existing = this.requests.get(key)
    if (existing) return existing as Promise<T>
    const pending = read().finally(() => {
      if (this.requests.get(key) === pending) this.requests.delete(key)
    })
    this.requests.set(key, pending)
    return pending
  }
}
