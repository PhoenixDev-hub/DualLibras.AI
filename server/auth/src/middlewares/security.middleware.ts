import type { RequestHandler } from 'express'
import { env } from '../config/env'

export const browserSecurity: RequestHandler = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')
  const origin = req.get('Origin')
  if (origin && !env.corsOrigins.includes(origin)) {
    res.status(403).json({ error: 'Origem não autorizada' })
    return
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.cookie &&
      !req.headers.authorization && !origin) {
    res.status(403).json({ error: 'Origem obrigatória para ações autenticadas' })
    return
  }
  next()
}

// One process/replica in the supplied deployment. Reject new keys on saturation
// instead of allowing an attacker to evict another user's active limit.
export function rateLimit(maximum: number, windowMs = 60000): RequestHandler {
  const buckets = new Map<string, { count: number; expires: number }>()
  return (req, res, next) => {
    const now = Date.now()
    for (const [key, value] of buckets) if (value.expires <= now) buckets.delete(key)
    const key = req.authenticatedUser?.id ?? req.ip ?? 'unknown'
    const bucket = buckets.get(key) ?? { count: 0, expires: now + windowMs }
    if (bucket.count >= maximum || (!buckets.has(key) && buckets.size >= 10000)) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.expires - now) / 1000))))
      res.status(429).json({ error: 'Muitas tentativas. Aguarde e tente novamente.' })
      return
    }
    bucket.count++
    buckets.set(key, bucket)
    next()
  }
}
