import { Router } from 'express';
import { materialController } from '../controllers/material.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const materialRoutes = Router();

materialRoutes.get('/', authMiddleware, materialController.list);
materialRoutes.post('/', authMiddleware, materialController.upload);
