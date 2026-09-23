import { z } from 'zod'
import {
  accountNameSchema,
  accountEmailSchema,
  accountPasswordSchema,
  loginPasswordSchema,
  profileTextSchema,
} from './Account.schema'

export const roleSchema = z.enum(['PROFESSOR', 'ALUNO'])

export const registerSchema = z
  .object({
    name: accountNameSchema,
    email: accountEmailSchema,
    password: accountPasswordSchema,
    role: roleSchema,
    institution: profileTextSchema('Instituição', 150),
    discipline: profileTextSchema('Disciplina', 100),
    registrationNumber: profileTextSchema('Matrícula', 50),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'PROFESSOR' && !data.discipline) {
      ctx.addIssue({
        code: 'custom',
        message: 'Disciplina é obrigatória para professores',
        path: ['discipline'],
      })
    }

    if (data.role === 'ALUNO' && !data.registrationNumber) {
      ctx.addIssue({
        code: 'custom',
        message: 'Matrícula é obrigatória para alunos',
        path: ['registrationNumber'],
      })
    }
  })

export const loginSchema = z.object({
  email: accountEmailSchema,
  password: loginPasswordSchema,
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
