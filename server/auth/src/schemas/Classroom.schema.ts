import { z } from "zod";
import { uuid, optionalString, dateLike } from "./Common";

/* ========================================================================
 * CLASSROOM
 * ==================================================================== */

export const ClassroomBaseSchema = z.object({
  id: uuid,
  name: z.string().trim().min(2).max(150),
  description: optionalString,
  code: z
    .string()
    .trim()
    .min(4, "Código muito curto")
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, "Código deve conter apenas letras, números e hífen"),
  teacherId: uuid,
  schoolId: uuid.nullable().optional(),
  createdAt: dateLike,
  updatedAt: dateLike,
});
export type Classroom = z.infer<typeof ClassroomBaseSchema>;

export const ClassroomCreateSchema = ClassroomBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type ClassroomCreateInput = z.infer<typeof ClassroomCreateSchema>;

export const ClassroomUpdateSchema = ClassroomCreateSchema.omit({
  teacherId: true, // normalmente não se transfere a turma por essa rota
}).partial();
export type ClassroomUpdateInput = z.infer<typeof ClassroomUpdateSchema>;

/* ========================================================================
 * CLASSROOM MEMBER (chave composta: classroomId + userId)
 * ==================================================================== */

export const ClassroomMemberBaseSchema = z.object({
  classroomId: uuid,
  userId: uuid,
  joinedAt: dateLike,
});
export type ClassroomMember = z.infer<typeof ClassroomMemberBaseSchema>;

export const ClassroomMemberCreateSchema = z.object({
  classroomId: uuid,
  userId: uuid,
});
export type ClassroomMemberCreateInput = z.infer<typeof ClassroomMemberCreateSchema>;

// Entrada da API: código e professor são definidos pelo servidor.
export const createClassroomSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).optional(),
});
export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
