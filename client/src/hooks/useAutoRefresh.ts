import { useEffect, useEffectEvent } from 'react'

export const DATA_CHANGED_EVENT = 'education:data-changed'

/** Refresh visible screens without overlapping requests or reloading the document. */
export function useAutoRefresh(
  refresh: (isCurrent: () => boolean) => Promise<unknown>,
  {
    enabled = true,
    interval = 15000,
    scope = '',
  }: { enabled?: boolean; interval?: number; scope?: string } = {},
) {
  const runRefresh = useEffectEvent(refresh)
  useEffect(() => {
    if (!enabled) return
    let disposed = false
    let running = false
    let pending = false
    let timer: number | undefined
    const available = () => document.visibilityState === 'visible' && navigator.onLine
    const schedule = (delay: number) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void run(), delay)
    }
    const run = async () => {
      if (disposed || !available()) return
      if (running) {
        pending = true
        return
      }
      running = true
      pending = false
      try {
        await runRefresh(() => !disposed)
      } catch {
        // Keep the last successful data during temporary connection failures.
      } finally {
        running = false
        if (!disposed && available()) schedule(pending ? 250 : interval)
      }
    }
    const invalidate = () => {
      if (running) pending = true
      else if (available()) schedule(250)
    }
    const resume = () => {
      if (available()) invalidate()
      else window.clearTimeout(timer)
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === DATA_CHANGED_EVENT) invalidate()
    }
    schedule(interval)
    window.addEventListener(DATA_CHANGED_EVENT, invalidate)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', resume)
    window.addEventListener('online', resume)
    window.addEventListener('offline', resume)
    document.addEventListener('visibilitychange', resume)
    return () => {
      disposed = true
      window.clearTimeout(timer)
      window.removeEventListener(DATA_CHANGED_EVENT, invalidate)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', resume)
      window.removeEventListener('online', resume)
      window.removeEventListener('offline', resume)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [enabled, interval, scope])
}
