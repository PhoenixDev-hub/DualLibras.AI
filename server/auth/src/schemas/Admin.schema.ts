import { z } from 'zod'
import {
  accountEmailSchema,
  accountNameSchema,
  accountPasswordSchema,
  profileTextSchema,
} from './Account.schema'
import { RoleSchema, LessonStatusSchema } from './Enums.schema'

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => !/[\p{Cc}\p{Cf}<>]/u.test(value), 'Texto contém caracteres inválidos')
export const adminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  q: z.string().trim().max(120).default(''),
  role: RoleSchema.optional(),
  schoolId: z.string().uuid().optional(),
  active: z.enum(['true', 'false']).optional(),
})
export const adminSchoolSchema = z
  .object({
    name: text(200).min(2, 'Informe o nome da escola'),
    city: text(100).default(''),
    state: z
      .union([
        z.literal(''),
        z.enum([
          'AC',
          'AL',
          'AP',
          'AM',
          'BA',
          'CE',
          'DF',
          'ES',
          'GO',
          'MA',
          'MT',
          'MS',
          'MG',
          'PA',
          'PB',
          'PR',
          'PE',
          'PI',
          'RJ',
          'RN',
          'RS',
          'RO',
          'RR',
          'SC',
          'SP',
          'SE',
          'TO',
        ]),
      ])
      .default(''),
  })
  .strict()
export const adminUserSchema = z
  .object({
    name: accountNameSchema,
    email: accountEmailSchema,
    role: RoleSchema,
    schoolId: z.string().uuid().nullable().default(null),
    password: accountPasswordSchema.optional(),
    discipline: profileTextSchema('Disciplina', 100),
    registrationNumber: profileTextSchema('Matrícula', 50),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.role === 'PROFESSOR' && !data.discipline)
      ctx.addIssue({
        code: 'custom',
        path: ['discipline'],
        message: 'Disciplina é obrigatória para professores',
      })
    if (data.role === 'ALUNO' && !data.registrationNumber)
      ctx.addIssue({
        code: 'custom',
        path: ['registrationNumber'],
        message: 'Matrícula é obrigatória para alunos',
      })
  })
export const adminStatusSchema = z.object({ isActive: z.boolean() }).strict()
export const adminPasswordSchema = z.object({ password: accountPasswordSchema }).strict()
export const adminClassroomSchema = z
  .object({
    name: text(150).min(2, 'Informe o nome da sala'),
    description: text(2000).default(''),
    schoolId: z.string().uuid().nullable().default(null),
    teacherId: z.string().uuid(),
  })
  .strict()
export const adminLessonSchema = z
  .object({
    title: text(200).min(1, 'Informe o título da aula'),
    status: LessonStatusSchema,
    classroomId: z.string().uuid().optional(),
  })
  .strict()
export const adminMemberSchema = z.object({ userId: z.string().uuid() }).strict()
export type AdminQuery = z.infer<typeof adminQuerySchema>
export type AdminUserInput = z.infer<typeof adminUserSchema>
export type AdminSchoolInput = z.infer<typeof adminSchoolSchema>
export type AdminClassroomInput = z.infer<typeof adminClassroomSchema>
export type AdminLessonInput = z.infer<typeof adminLessonSchema>
