import { z } from 'zod';

export const createClassroomSchema = z.object({
  name: z.string().trim().min(2, 'Nome da sala deve ter pelo menos 2 caracteres'),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
