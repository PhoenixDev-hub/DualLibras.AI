import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/error.middleware'

export type TranscriptInput = { segmentId: string; text: string; capturedAt: string }

export async function publishTranscript(userId: string, lessonId: string, data: TranscriptInput) {
  const matches = (saved: { userId: string; lessonId: string | null; transcript: string | null }) => {
    if (saved.userId !== userId || saved.lessonId !== lessonId || saved.transcript !== data.text)
      throw new AppError('Identificador de trecho já utilizado com outro conteúdo', 409)
  }
  const existing = await prisma.transcriptionSession.findUnique({ where: { id: data.segmentId } })
  if (existing) { matches(existing); return }
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
  if (!lesson || lesson.status !== 'EM_ANDAMENTO')
    throw new AppError('Aula não está em andamento. O trecho continua pendente no navegador.', 409)
  try {
    await prisma.transcriptionSession.create({
      data: { id: data.segmentId, lessonId, userId, transcript: data.text,
        startedAt: new Date(data.capturedAt), status: 'FINALIZADA', finishedAt: new Date() },
    })
  } catch (error) {
    // The unique primary key arbitrates concurrent retries, including a response
    // lost after commit. Do not overwrite an existing segment with upsert/update.
    if ((error as { code?: string }).code !== 'P2002') throw error
    const saved = await prisma.transcriptionSession.findUnique({ where: { id: data.segmentId } })
    if (!saved) throw error
    matches(saved)
  }
}
