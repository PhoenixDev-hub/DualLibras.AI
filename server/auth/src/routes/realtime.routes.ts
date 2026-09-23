import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../middlewares/auth.middleware'
import { rateLimit } from '../middlewares/security.middleware'
import { wsTickets } from '../services/ws-tickets'

export const realtimeRoutes = Router()
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
