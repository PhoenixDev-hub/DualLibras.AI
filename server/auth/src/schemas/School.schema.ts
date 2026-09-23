import { z } from 'zod'
import { uuid, optionalString, dateLike } from './Common'

export const SchoolBaseSchema = z.object({
  id: uuid,
  name: z.string().trim().min(2).max(200),
  city: optionalString,
  state: z
    .string()
    .trim()
    .length(2, 'UF deve ter 2 letras (ex: CE, SP)')
    .toUpperCase()
    .nullable()
    .optional(),
  createdAt: dateLike,
  updatedAt: dateLike,
})
export type School = z.infer<typeof SchoolBaseSchema>

export const SchoolCreateSchema = SchoolBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export type SchoolCreateInput = z.infer<typeof SchoolCreateSchema>

export const SchoolUpdateSchema = SchoolCreateSchema.partial()
export type SchoolUpdateInput = z.infer<typeof SchoolUpdateSchema>
