import { z } from 'zod'

export const uuid = z.string().uuid()

export const optionalString = z.string().trim().min(1).nullable().optional()

export const dateLike = z.coerce.date()
export const optionalDateLike = z.coerce.date().nullable().optional()
