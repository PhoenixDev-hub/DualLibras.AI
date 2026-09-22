import { z } from "zod";
import { accountNameSchema, accountEmailSchema, accountPasswordSchema, profileTextSchema } from "./Account.schema";
import { RoleSchema } from "./Enums.schema";
import { uuid, dateLike } from "./Common";

/* ========================================================================
 * USER
 * ==================================================================== */

export const UserBaseSchema = z.object({
  id: uuid,
  name: accountNameSchema,
  email: accountEmailSchema,
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
  name: accountNameSchema,
  email: accountEmailSchema,
  password: accountPasswordSchema,
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
  discipline: profileTextSchema("Disciplina", 100).nullable(),
  institution: profileTextSchema("Instituição", 150).nullable(),
  createdAt: dateLike,
  updatedAt: dateLike,
});
export type TeacherProfile = z.infer<typeof TeacherProfileBaseSchema>;

export const TeacherProfileCreateSchema = z.object({
  userId: uuid,
  discipline: profileTextSchema("Disciplina", 100).nullable(),
  institution: profileTextSchema("Instituição", 150).nullable(),
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
  registrationNumber: profileTextSchema("Matrícula", 50).nullable(),
  institution: profileTextSchema("Instituição", 150).nullable(),
  createdAt: dateLike,
  updatedAt: dateLike,
});
export type StudentProfile = z.infer<typeof StudentProfileBaseSchema>;

export const StudentProfileCreateSchema = z.object({
  userId: uuid,
  registrationNumber: profileTextSchema("Matrícula", 50).nullable(),
  institution: profileTextSchema("Instituição", 150).nullable(),
});
export type StudentProfileCreateInput = z.infer<typeof StudentProfileCreateSchema>;

export const StudentProfileUpdateSchema = StudentProfileCreateSchema.omit({
  userId: true,
}).partial();
export type StudentProfileUpdateInput = z.infer<typeof StudentProfileUpdateSchema>;
