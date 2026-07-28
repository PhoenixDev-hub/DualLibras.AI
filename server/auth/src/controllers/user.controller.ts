import type { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { AppError } from '../middlewares/error.middleware';

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
        createdAt: user.createdAt,
      });
    } catch (err) {
      next(err);
    }
  },
};
