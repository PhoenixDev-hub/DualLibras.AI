import type { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { AppError } from '../middlewares/error.middleware';
import { dashboardService } from '../services/dashboard.service';

export const userController = {
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) throw new AppError('Não autenticado', 401);

      const user = await userService.findById(userId);
      if (!user) throw new AppError('Usuário não encontrado', 404);

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        discipline: user.teacherProfile?.discipline,
        institution: user.teacherProfile?.institution ?? user.studentProfile?.institution,
        registrationNumber: user.studentProfile?.registrationNumber,
        access: dashboardService.getAccess(user.role),
        createdAt: user.createdAt,
      });
    } catch (err) {
      next(err);
    }
  },
};
