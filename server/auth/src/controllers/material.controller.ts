import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/error.middleware';
import { uploadMaterialSchema } from '../schemas/material.schema';
import { materialService, formatMaterial } from '../services/material.service';
import { userService } from '../services/user.service';

export const materialController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) throw new AppError('Não autenticado', 401);

      const user = await userService.findById(userId);
      if (!user) throw new AppError('Usuário não encontrado', 404);

      const materials = await materialService.listForUser(user.id, user.role);
      res.json({ materials: materials.map(formatMaterial) });
    } catch (err) {
      next(err);
    }
  },

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) throw new AppError('Não autenticado', 401);

      const user = await userService.findById(userId);
      if (!user) throw new AppError('Usuário não encontrado', 404);

      const parsed = uploadMaterialSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Dados inválidos', 400);
      }

      const result = await materialService.upload(user.id, user.role, parsed.data);

      res.status(201).json({
        material: formatMaterial(result.material),
        ai: {
          sent: result.sentToAi,
          status: result.sentToAi ? 'enviado' : 'pendente',
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
