import { z } from "zod";
import { MaterialTypeSchema } from "./Enums.schema";
import { uuid, dateLike } from "./Common";

export const MaterialBaseSchema = z.object({
  id: uuid,
  name: z.string().trim().min(1).max(200),
  url: z.string().trim().url("URL inválida"),
  type: MaterialTypeSchema,
  lessonId: uuid.nullable().optional(),
  uploadedById: uuid,
  createdAt: dateLike,
  updatedAt: dateLike,
});
export type Material = z.infer<typeof MaterialBaseSchema>;

export const MaterialCreateSchema = MaterialBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type MaterialCreateInput = z.infer<typeof MaterialCreateSchema>;

export const MaterialUpdateSchema = MaterialCreateSchema.omit({
  uploadedById: true,
}).partial();
export type MaterialUpdateInput = z.infer<typeof MaterialUpdateSchema>;

export const uploadMaterialSchema = z.object({
  filename: z.string().trim().min(1),
  contentBase64: z.string().min(1),
  classroomId: uuid.optional(),
  lessonId: uuid.optional(),
});
export type UploadMaterialInput = z.infer<typeof uploadMaterialSchema>;
