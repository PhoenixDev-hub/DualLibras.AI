import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../middlewares/auth.middleware'
import { rateLimit } from '../middlewares/security.middleware'
import { wsTickets } from '../services/ws-tickets'
import { demoTickets } from '../services/demo-tickets'
import { env } from '../config/env'

export const realtimeRoutes = Router()
realtimeRoutes.post('/demo-ticket', (req, res) => {
  if (!req.get('Origin') || !env.corsOrigins.includes(req.get('Origin')!)) {
    res.status(403).json({ error: 'Origem não autorizada' }); return
  }
  if (!z.object({}).strict().safeParse(req.body).success) {
    res.status(400).json({ error: 'Solicitação de demonstração inválida' }); return
  }
  const ticket = demoTickets.issue(req.ip ?? 'unknown')
  if (!ticket) {
    res.setHeader('Retry-After', '3600')
    res.status(429).json({ error: 'Limite da demonstração atingido. Tente novamente em uma hora ou entre na sua conta.' }); return
  }
  res.setHeader('Cache-Control', 'no-store')
  res.json({ ticket, maxSeconds: 60 })
})
realtimeRoutes.post('/ticket', authMiddleware, rateLimit(20), (req, res) => {
  const parsed = z.object({ lessonId: z.string().uuid() }).strict().safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Aula obrigatória' }); return }
  if (!['PROFESSOR', 'ADMIN'].includes(req.authenticatedUser!.role)) {
    res.status(403).json({ error: 'Sem permissão para capturar áudio' }); return
  }
  // Membership and lesson status are checked by /internal/ai/authorize on connect
  // and throughout capture. The ticket only transports the existing session.
  const ticket = wsTickets.issue(parsed.data.lessonId, {
    cookie: req.headers.cookie, authorization: req.headers.authorization,
  })
  res.setHeader('Cache-Control', 'no-store')
  res.json({ ticket })
})
