import { z } from 'zod'
import { dateLike, optionalString, uuid } from './Common'

/* ========================================================================
 * GLOSSARY
 * ==================================================================== */

export const GlossaryBaseSchema = z.object({
  id: uuid,
  name: z.string().trim().min(2).max(150),
  description: optionalString,
  subject: z.string().trim().min(2).max(100),
  ownerId: uuid,
  classroomId: uuid.nullable().optional(),
  createdAt: dateLike,
  updatedAt: dateLike,
})
export type Glossary = z.infer<typeof GlossaryBaseSchema>

export const GlossaryCreateSchema = GlossaryBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export type GlossaryCreateInput = z.infer<typeof GlossaryCreateSchema>

export const GlossaryUpdateSchema = GlossaryCreateSchema.omit({
  ownerId: true,
}).partial()
export type GlossaryUpdateInput = z.infer<typeof GlossaryUpdateSchema>

/* ========================================================================
 * GLOSSARY TERM
 * ==================================================================== */

export const GlossaryTermBaseSchema = z.object({
  id: uuid,
  term: z.string().trim().min(1).max(150),
  definition: optionalString,
  correction: optionalString,
  librasValue: optionalString,
  glossaryId: uuid,
  createdAt: dateLike,
  updatedAt: dateLike,
})
export type GlossaryTerm = z.infer<typeof GlossaryTermBaseSchema>

export const GlossaryTermCreateSchema = GlossaryTermBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export type GlossaryTermCreateInput = z.infer<typeof GlossaryTermCreateSchema>

export const GlossaryTermUpdateSchema = GlossaryTermCreateSchema.omit({
  glossaryId: true,
}).partial()
export type GlossaryTermUpdateInput = z.infer<typeof GlossaryTermUpdateSchema>
