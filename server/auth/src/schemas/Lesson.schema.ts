import { z } from 'zod'
import { LessonStatusSchema } from './Enums.schema'
import { uuid, optionalString, dateLike, optionalDateLike } from './Common'

/* ========================================================================
 * LESSON
 * ==================================================================== */

export const LessonBaseSchema = z
  .object({
    id: uuid,
    title: z.string().trim().min(2).max(200),
    description: optionalString,
    lessonPlan: optionalString,
    status: LessonStatusSchema.default('AGENDADA'),
    classroomId: uuid,
    teacherId: uuid,
    glossaryId: uuid.nullable().optional(),
    startedAt: optionalDateLike,
    finishedAt: optionalDateLike,
    createdAt: dateLike,
    updatedAt: dateLike,
  })
  .refine((data) => !data.startedAt || !data.finishedAt || data.finishedAt >= data.startedAt, {
    message: 'finishedAt não pode ser anterior a startedAt',
    path: ['finishedAt'],
  })
export type Lesson = z.infer<typeof LessonBaseSchema>

export const LessonCreateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: optionalString,
  lessonPlan: optionalString,
  status: LessonStatusSchema.default('AGENDADA'),
  classroomId: uuid,
  teacherId: uuid,
  glossaryId: uuid.nullable().optional(),
  startedAt: optionalDateLike,
  finishedAt: optionalDateLike,
})
export type LessonCreateInput = z.infer<typeof LessonCreateSchema>

export const LessonUpdateSchema = LessonCreateSchema.partial()
export type LessonUpdateInput = z.infer<typeof LessonUpdateSchema>

/* ========================================================================
 * SUMMARY (1:1 com Lesson)
 * ==================================================================== */

export const SummaryBaseSchema = z.object({
  id: uuid,
  lessonId: uuid,
  content: z.string().trim().min(1),
  createdAt: dateLike,
  updatedAt: dateLike,
})
export type Summary = z.infer<typeof SummaryBaseSchema>

export const SummaryCreateSchema = z.object({
  lessonId: uuid,
  content: z.string().trim().min(1),
})
export type SummaryCreateInput = z.infer<typeof SummaryCreateSchema>

export const SummaryUpdateSchema = z.object({
  content: z.string().trim().min(1),
})
export type SummaryUpdateInput = z.infer<typeof SummaryUpdateSchema>
