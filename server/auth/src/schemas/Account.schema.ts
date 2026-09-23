import { z } from 'zod'
import {
  emailError,
  nameError,
  normalizeEmail,
  normalizeName,
  passwordError,
  profileError,
} from '../validation/account'

function checked(check: (value: string) => string | undefined) {
  return z.string().superRefine((value, ctx) => {
    const message = check(value)
    if (message) ctx.addIssue({ code: 'custom', message })
  })
}
export const accountNameSchema = checked(nameError).transform(normalizeName)
export const accountEmailSchema = checked(emailError).transform(normalizeEmail)
export const accountPasswordSchema = checked((value) => passwordError(value))
export const loginPasswordSchema = checked((value) => passwordError(value, true))
export const profileTextSchema = (label: string, max: number) =>
  checked((value) => profileError(value, label, max))
    .transform((value) => value.trim())
    .optional()
