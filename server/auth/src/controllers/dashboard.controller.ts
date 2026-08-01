import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/error.middleware';
import { userService } from '../services/user.service';
import { dashboardService } from '../services/dashboard.service';

export const dashboardController = {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) throw new AppError('Não autenticado', 401);

      const user = await userService.findById(userId);
      if (!user) throw new AppError('Usuário não encontrado', 404);

      res.json(dashboardService.getDashboard(user.role));
    } catch (err) {
      next(err);
    }
  },
};
