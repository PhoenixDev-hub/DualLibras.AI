import { z } from 'zod';

export const uploadMaterialSchema = z.object({
  filename: z.string().trim().min(1, 'Nome do arquivo é obrigatório'),
  contentBase64: z.string().min(1, 'Arquivo é obrigatório'),
  classroomId: z.string().uuid().optional(),
});

export type UploadMaterialInput = z.infer<typeof uploadMaterialSchema>;
