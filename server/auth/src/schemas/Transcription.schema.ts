import { z } from 'zod'
import { SessionStatusSchema } from './Enums.schema'
import { uuid, optionalString, dateLike, optionalDateLike } from './Common'

/* ========================================================================
 * TRANSCRIPTION SESSION
 * ==================================================================== */

export const TranscriptionSessionBaseSchema = z
  .object({
    id: uuid,
    status: SessionStatusSchema.default('ATIVA'),
    userId: uuid,
    lessonId: uuid.nullable().optional(),
    transcript: optionalString,
    startedAt: dateLike,
    finishedAt: optionalDateLike,
    createdAt: dateLike,
    updatedAt: dateLike,
  })
  .refine((data) => !data.finishedAt || data.finishedAt >= data.startedAt, {
    message: 'finishedAt não pode ser anterior a startedAt',
    path: ['finishedAt'],
  })
export type TranscriptionSession = z.infer<typeof TranscriptionSessionBaseSchema>

export const TranscriptionSessionCreateSchema = z.object({
  userId: uuid,
  lessonId: uuid.nullable().optional(),
  status: SessionStatusSchema.default('ATIVA'),
})
export type TranscriptionSessionCreateInput = z.infer<typeof TranscriptionSessionCreateSchema>

export const TranscriptionSessionUpdateSchema = z.object({
  status: SessionStatusSchema.optional(),
  transcript: optionalString,
  finishedAt: optionalDateLike,
})
export type TranscriptionSessionUpdateInput = z.infer<typeof TranscriptionSessionUpdateSchema>

/* ========================================================================
 * TRANSCRIPT SEGMENT
 * ==================================================================== */

export const TranscriptSegmentBaseSchema = z
  .object({
    id: uuid,
    sessionId: uuid,
    text: z.string().trim().min(1),
    startTime: z.number().nonnegative().nullable().optional(),
    endTime: z.number().nonnegative().nullable().optional(),
    createdAt: dateLike,
  })
  .refine(
    (data) => data.startTime == null || data.endTime == null || data.endTime >= data.startTime,
    { message: 'endTime não pode ser anterior a startTime', path: ['endTime'] },
  )
export type TranscriptSegment = z.infer<typeof TranscriptSegmentBaseSchema>

export const TranscriptSegmentCreateSchema = z.object({
  sessionId: uuid,
  text: z.string().trim().min(1),
  startTime: z.number().nonnegative().nullable().optional(),
  endTime: z.number().nonnegative().nullable().optional(),
})
export type TranscriptSegmentCreateInput = z.infer<typeof TranscriptSegmentCreateSchema>
