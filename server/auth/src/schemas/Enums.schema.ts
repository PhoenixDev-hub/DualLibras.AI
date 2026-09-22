import { z } from "zod";

export const RoleSchema = z.enum(["PROFESSOR", "ALUNO", "ADMIN"]);
export type Role = z.infer<typeof RoleSchema>;

export const LessonStatusSchema = z.enum([
  "AGENDADA",
  "EM_ANDAMENTO",
  "FINALIZADA",
  "CANCELADA",
]);
export type LessonStatus = z.infer<typeof LessonStatusSchema>;

export const MaterialTypeSchema = z.enum(["PDF", "DOCX", "PPTX", "OUTRO"]);
export type MaterialType = z.infer<typeof MaterialTypeSchema>;

export const SessionStatusSchema = z.enum(["ATIVA", "FINALIZADA", "CANCELADA"]);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
