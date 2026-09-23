import fs from 'node:fs'
import { materialAccessWhere } from '../services/material-access'
import path from 'node:path'
import { env } from '../config/env'
import { Router, Request } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { authMiddleware } from '../middlewares/auth.middleware'
import { AppError } from '../middlewares/error.middleware'
import { createClassroomSchema } from '../schemas/Classroom.schema'
import { rateLimit } from '../middlewares/security.middleware'
import { publishTranscript } from '../services/transcription.service'

type AuthRequest = Request

export const educationRoutes = Router()
educationRoutes.use(authMiddleware)
async function owned(userId: string, id: string, role?: string) {
  const room = await prisma.classroom.findUnique({ where: { id } })
  if (!room) throw new AppError('Sala não encontrada', 404)
  const userRole = role ?? (await prisma.user.findUniqueOrThrow({ where: { id: userId } })).role
  if (userRole !== 'ADMIN' && room.teacherId !== userId)
    throw new AppError('Sem permissão para alterar esta sala', 403)
  return room
}
educationRoutes.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.sub
    const user =
      req.authenticatedUser ?? (await prisma.user.findUniqueOrThrow({ where: { id: userId } }))
    const rooms = await prisma.classroom.findMany({
      where:
        user.role === 'ADMIN'
          ? {}
          : { OR: [{ teacherId: userId }, { members: { some: { userId } } }] },
      select: {
        id: true,
        name: true,
        description: true,
        teacherId: true,
        code: true,
        teacher: {
          select: {
            name: true,
            teacherProfile: { select: { discipline: true } },
          },
        },
        members: {
          select: {
            userId: true,
            joinedAt: true,
            user: { select: { id: true, name: true, role: true } },
          },
        },
        lessons: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            startedAt: true,
            finishedAt: true,
            status: true,
            summary: { select: { content: true } },
            transcriptionSessions: {
              select: { transcript: true },
              orderBy: { startedAt: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    const roomIds = rooms.map((r) => r.id)
    const [materials, glossaries] = await Promise.all([
      prisma.material.findMany({
        where: materialAccessWhere(userId, user.role),
        select: {
          id: true,
          name: true,
          lessonId: true,
          type: true,
          classroomId: true,
          lesson: { select: { classroomId: true } },
        },
      }),
      prisma.glossary.findMany({
        where:
          user.role === 'ADMIN'
            ? {}
            : {
                OR: [{ ownerId: userId }, { classroomId: { in: roomIds } }],
              },
        select: {
          subject: true,
          terms: { select: { id: true, term: true, definition: true, librasValue: true } },
        },
      }),
    ])
    const students = new Map<
      string,
      { id: string; name: string; classroomIds: string[]; joined: string }
    >()
    for (const room of rooms)
      for (const member of room.members) {
        if (member.user.role !== 'ALUNO') continue
        const student = students.get(member.userId) ?? {
          id: member.userId,
          name: member.user.name,
          classroomIds: [],
          joined: member.joinedAt.toISOString(),
        }
        student.classroomIds.push(room.id)
        students.set(member.userId, student)
      }
    res.json({
      classrooms: rooms.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? '',
        subject: r.teacher.teacherProfile?.discipline ?? '',
        teacherName: r.teacher.name,
        canAttachMaterials:
          user.role === 'ADMIN' || (user.role === 'PROFESSOR' && r.teacherId === userId),
        code: r.code,
        color: 'blue',
        archived: false,
      })),
      students: [...students.values()],
      lessons: rooms.flatMap((r) =>
        r.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          transcript: l.transcriptionSessions
            .map((s) => s.transcript)
            .filter(Boolean)
            .join('\n\n'),
          summary: l.summary?.content ?? '',
          classroomId: r.id,
          date: l.createdAt.toISOString(),
          duration:
            l.startedAt && l.finishedAt
              ? `${Math.round((+l.finishedAt - +l.startedAt) / 60000)} min`
              : '—',
          status: (
            {
              EM_ANDAMENTO: 'live',
              FINALIZADA: 'finished',
              AGENDADA: 'scheduled',
              CANCELADA: 'cancelled',
            } as const
          )[l.status],
        })),
      ),
      materials: materials.map((m) => ({
        id: m.id,
        name: m.name,
        lessonId: m.lessonId,
        type: m.type,
        subject: 'Materiais',
        classroomId: m.classroomId ?? m.lesson?.classroomId ?? '',
      })),
      terms: glossaries.flatMap((g) =>
        g.terms.map((t) => ({
          id: t.id,
          term: t.term,
          definition: t.definition ?? '',
          subject: g.subject,
          example: t.librasValue ?? '',
        })),
      ),
    })
  } catch (error) {
    next(error)
  }
})
educationRoutes.patch('/classrooms/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = String(req.params.id)
    await owned(req.user!.sub, id, req.authenticatedUser?.role)
    const parsed = createClassroomSchema.safeParse(req.body)
    if (!parsed.success) throw new AppError('Nome ou descrição inválidos', 400)
    await prisma.classroom.update({ where: { id }, data: parsed.data })
    res.sendStatus(204)
  } catch (error) {
    next(error)
  }
})
educationRoutes.post('/join', rateLimit(env.joinLimit), async (req, res, next) => {
  try {
    const parsed = z
      .object({
        code: z
          .string()
          .trim()
          .min(1)
          .max(30)
          .transform((v) => v.toUpperCase()),
      })
      .safeParse(req.body)
    if (!parsed.success) throw new AppError('Informe um código válido', 400)
    const room = await prisma.classroom.findUnique({
      where: { code: parsed.data.code },
    })
    if (!room) throw new AppError('Sala não encontrada. Confira o código.', 404)
    const userId = req.user!.sub
    await prisma.classroomMember.upsert({
      where: { classroomId_userId: { classroomId: room.id, userId } },
      create: { classroomId: room.id, userId },
      update: {},
    })
    res.json({ classroomId: room.id })
  } catch (error) {
    next(error)
  }
})
educationRoutes.delete('/classrooms/:id/members/:userId', async (req: AuthRequest, res, next) => {
  try {
    const classroomId = String(req.params.id)
    await owned(req.user!.sub, classroomId, req.authenticatedUser?.role)
    await prisma.classroomMember.deleteMany({
      where: { classroomId, userId: String(req.params.userId) },
    })
    res.sendStatus(204)
  } catch (error) {
    next(error)
  }
})

// Os arquivos só são entregues a quem tem acesso à aula.
educationRoutes.get('/materials/:id/download', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.sub
    const material = await prisma.material.findFirst({
      where: {
        id: String(req.params.id),
        ...materialAccessWhere(userId, req.authenticatedUser?.role),
      },
    })
    if (!material) throw new AppError('Material não encontrado', 404)
    let file: string
    try {
      const root = await fs.promises.realpath(path.resolve(env.materialUploadDir))
      file = await fs.promises.realpath(path.resolve(material.url))
      const relative = path.relative(root, file)
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative))
        throw new Error('Invalid file path')
      await fs.promises.access(file, fs.constants.R_OK)
    } catch {
      throw new AppError('Arquivo indisponível', 404)
    }
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.download(file, material.name, (error) => {
      if (error) next(error)
    })
  } catch (error) {
    next(error)
  }
})

educationRoutes.post('/lessons', async (req: AuthRequest, res, next) => {
  try {
    const parsed = z
      .object({ title: z.string().trim().min(1).max(200), classroomId: z.string().uuid() })
      .safeParse(req.body)
    if (!parsed.success) throw new AppError('Título ou turma inválidos', 400)
    const data = parsed.data
    const room = await owned(req.user!.sub, data.classroomId, req.authenticatedUser?.role)
    const lesson = await prisma.lesson.create({
      data: { ...data, teacherId: room.teacherId, status: 'EM_ANDAMENTO', startedAt: new Date() },
    })
    res.status(201).json({
      id: lesson.id,
      title: lesson.title,
      classroomId: lesson.classroomId,
      date: lesson.createdAt.toISOString(),
      duration: '0 min',
      status: 'live',
      transcript: '',
      summary: '',
    })
  } catch (error) {
    next(error)
  }
})
async function ownedLesson(userId: string, id: string, role?: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id } })
  if (!lesson) throw new AppError('Aula não encontrada', 404)
  await owned(userId, lesson.classroomId, role)
  return lesson
}
educationRoutes.post('/lessons/:id/transcript', async (req: AuthRequest, res, next) => {
  try {
    const parsed = z.object({
      text: z.string().trim().min(1).max(20000),
      segmentId: z.string().uuid(),
      capturedAt: z.string().datetime().refine(value => Date.parse(value) <= Date.now() + 60000),
    }).safeParse(req.body)
    if (!parsed.success) throw new AppError('Transcrição inválida', 400)
    const data = parsed.data
    const lesson = await ownedLesson(
      req.user!.sub,
      String(req.params.id),
      req.authenticatedUser?.role,
    )
    await publishTranscript(req.user!.sub, lesson.id, data)
    res.sendStatus(204)
  } catch (error) {
    next(error)
  }
})
educationRoutes.post('/lessons/:id/finish', async (req: AuthRequest, res, next) => {
  try {
    const lesson = await ownedLesson(
      req.user!.sub,
      String(req.params.id),
      req.authenticatedUser?.role,
    )
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { status: 'FINALIZADA', finishedAt: new Date() },
    })
    res.sendStatus(204)
  } catch (error) {
    next(error)
  }
})
