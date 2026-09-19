import { z } from 'zod';

export const roleSchema = z.enum(['PROFESSOR', 'ALUNO', 'SOCIEDADE']);

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  role: roleSchema,
  institution: z.string().trim().optional(),
  discipline: z.string().trim().optional(),
  registrationNumber: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'PROFESSOR' && !data.discipline) {
    ctx.addIssue({
      code: 'custom',
      message: 'Disciplina é obrigatória para professores',
      path: ['discipline'],
    });
  }

  if (data.role === 'ALUNO' && !data.registrationNumber) {
    ctx.addIssue({
      code: 'custom',
      message: 'Matrícula é obrigatória para alunos',
      path: ['registrationNumber'],
    });
  }
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
