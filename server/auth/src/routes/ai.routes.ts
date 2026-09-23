import { timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env'
import { prisma } from '../config/prisma'
import { authMiddleware } from '../middlewares/auth.middleware'
import { AppError } from '../middlewares/error.middleware'
import { wsTickets } from '../services/ws-tickets'
import { demoTickets } from '../services/demo-tickets'

// Only the Python service can introspect. User identity always comes from the
// original session, never from uploaded_by or a caller-supplied user identifier.
export const aiRoutes = Router()
aiRoutes.use((req, res, next) => {
  const supplied = Buffer.from(req.get('X-AI-Internal-Token') ?? '')
  const expected = Buffer.from(env.aiInternalToken)
  if (!expected.length || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    res.status(403).json({ error: 'Acesso interno obrigatório' })
    return
  }
  next()
})
// This exchange is behind the internal secret and the public gateway block.
aiRoutes.post('/ws-session', (req, res) => {
  const parsed = z.object({ ticket: z.string().regex(/^[a-f0-9]{64}$/), lessonId: z.string().uuid() }).strict().safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Ticket inválido' }); return }
  const headers = wsTickets.consume(parsed.data.ticket, parsed.data.lessonId)
  if (!headers) { res.status(401).json({ error: 'Ticket expirado ou inválido' }); return }
  res.setHeader('Cache-Control', 'no-store')
  res.json(headers)
})
aiRoutes.post('/demo-session', (req, res) => {
  const parsed = z.object({ ticket: z.string().regex(/^[a-f0-9]{64}$/) }).strict().safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Ticket inválido' }); return }
  const visitorId = demoTickets.consume(parsed.data.ticket)
  if (!visitorId) { res.status(401).json({ error: 'Ticket expirado ou inválido' }); return }
  res.setHeader('Cache-Control', 'no-store')
  res.json({ visitorId })
})
aiRoutes.use(authMiddleware)
aiRoutes.get('/authorize', async (req, res, next) => {
  try {
    const query = z.object({
      action: z.enum(['read', 'write', 'capture', 'ingest']).default('read'),
      lessonId: z.string().uuid().optional(),
      materialId: z.string().uuid().optional(),
    }).strict().safeParse(req.query)
    if (!query.success) throw new AppError('Escopo inválido', 400)
    const { action, lessonId, materialId } = query.data
    const user = req.authenticatedUser!
    let classroomId: string | undefined
    if (action !== 'read' && !['PROFESSOR', 'ADMIN'].includes(user.role))
      throw new AppError('Somente professores podem iniciar esta operação', 403)
    if (action === 'ingest') {
      if (!materialId) throw new AppError('Material obrigatório', 400)
      const material = await prisma.material.findUnique({
        where: { id: materialId },
        include: { classroom: true, lesson: { include: { classroom: true } } },
      })
      const room = material?.classroom ?? material?.lesson?.classroom
      if (!material || !room || (user.role !== 'ADMIN' && room.teacherId !== user.id))
        throw new AppError('Material indisponível', 403)
      classroomId = room.id
    } else if (materialId) throw new AppError('Escopo inválido', 400)
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { classroom: { include: { members: { where: { userId: user.id } } } } },
      })
      if (!lesson) throw new AppError('Aula indisponível', 404)
      const owner = user.role === 'ADMIN' || lesson.classroom.teacherId === user.id
      if (!owner && (action !== 'read' || !lesson.classroom.members.length))
        throw new AppError('Sem acesso à aula', 403)
      if (action === 'capture' && lesson.status !== 'EM_ANDAMENTO')
        throw new AppError('Aula encerrada', 409)
      classroomId = lesson.classroomId
    }
    res.setHeader('Cache-Control', 'no-store')
    res.json({ userId: user.id, role: user.role, lessonId: lessonId ?? null, classroomId: classroomId ?? null })
  } catch (error) { next(error) }
})
