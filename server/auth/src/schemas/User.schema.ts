import { z } from "zod";
import { RoleSchema } from "./Enums.schema";
import { uuid, optionalString, dateLike } from "./Common";

/* ========================================================================
 * USER
 * ==================================================================== */

export const UserBaseSchema = z.object({
  id: uuid,
  name: z.string().trim().min(2, "Nome muito curto").max(150),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  passwordHash: z.string().min(1),
  role: RoleSchema,
  schoolId: uuid.nullable().optional(),
  createdAt: dateLike,
  updatedAt: dateLike,
});
export type User = z.infer<typeof UserBaseSchema>;

// Para criação: não recebemos passwordHash pronto, e sim uma senha em texto
// puro que deve ser validada e depois hasheada na camada de serviço.
export const UserCreateSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(150),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .max(72, "Senha muito longa") // limite comum de algoritmos tipo bcrypt
    .regex(/[a-z]/, "A senha deve conter ao menos uma letra minúscula")
    .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
    .regex(/[0-9]/, "A senha deve conter ao menos um número"),
  role: RoleSchema,
  schoolId: uuid.nullable().optional(),
});
export type UserCreateInput = z.infer<typeof UserCreateSchema>;

export const UserUpdateSchema = UserCreateSchema.omit({ password: true })
  .partial()
  .extend({
    password: UserCreateSchema.shape.password.optional(),
  });
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;

/* ========================================================================
 * TEACHER PROFILE
 * ==================================================================== */

export const TeacherProfileBaseSchema = z.object({
  id: uuid,
  userId: uuid,
  discipline: optionalString,
  institution: optionalString,
  createdAt: dateLike,
  updatedAt: dateLike,
});
export type TeacherProfile = z.infer<typeof TeacherProfileBaseSchema>;

export const TeacherProfileCreateSchema = z.object({
  userId: uuid,
  discipline: optionalString,
  institution: optionalString,
});
export type TeacherProfileCreateInput = z.infer<typeof TeacherProfileCreateSchema>;

export const TeacherProfileUpdateSchema = TeacherProfileCreateSchema.omit({
  userId: true,
}).partial();
export type TeacherProfileUpdateInput = z.infer<typeof TeacherProfileUpdateSchema>;

/* ========================================================================
 * STUDENT PROFILE
 * ==================================================================== */

export const StudentProfileBaseSchema = z.object({
  id: uuid,
  userId: uuid,
  registrationNumber: optionalString,
  institution: optionalString,
  createdAt: dateLike,
  updatedAt: dateLike,
});
export type StudentProfile = z.infer<typeof StudentProfileBaseSchema>;

export const StudentProfileCreateSchema = z.object({
  userId: uuid,
  registrationNumber: optionalString,
  institution: optionalString,
});
export type StudentProfileCreateInput = z.infer<typeof StudentProfileCreateSchema>;

export const StudentProfileUpdateSchema = StudentProfileCreateSchema.omit({
  userId: true,
}).partial();
export type StudentProfileUpdateInput = z.infer<typeof StudentProfileUpdateSchema>;

/* ========================================================================
 * SOCIETY PROFILE
 * ==================================================================== */

export const SocietyProfileBaseSchema = z.object({
  id: uuid,
  userId: uuid,
  createdAt: dateLike,
  updatedAt: dateLike,
});
export type SocietyProfile = z.infer<typeof SocietyProfileBaseSchema>;

export const SocietyProfileCreateSchema = z.object({
  userId: uuid,
});
export type SocietyProfileCreateInput = z.infer<typeof SocietyProfileCreateSchema>;
