import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/error.middleware';
import { createClassroomSchema } from '../schemas/classroom.schema';
import { classroomService } from '../services/classroom.service';
import { userService } from '../services/user.service';

function formatClassroom(classroom: Awaited<ReturnType<typeof classroomService.create>>) {
  return {
    id: classroom.id,
    name: classroom.name,
    code: classroom.code,
    studentsCount: classroom.members.length,
    lessonsCount: classroom.lessons.length,
    createdAt: classroom.createdAt,
  };
}

export const classroomController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) throw new AppError('Não autenticado', 401);

      const user = await userService.findById(userId);
      if (!user) throw new AppError('Usuário não encontrado', 404);

      const classrooms = await classroomService.listForUser(user.id, user.role);
      res.json({ classrooms: classrooms.map(formatClassroom) });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) throw new AppError('Não autenticado', 401);

      const user = await userService.findById(userId);
      if (!user) throw new AppError('Usuário não encontrado', 404);

      const parsed = createClassroomSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Dados inválidos', 400);
      }

      const data = parsed.data;
      const classroom = await classroomService.create(user.id, user.role, data);

      res.status(201).json({ classroom: formatClassroom(classroom) });
    } catch (err) {
      next(err);
    }
  },
};
