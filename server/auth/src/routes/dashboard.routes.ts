import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const dashboardRoutes = Router();

dashboardRoutes.get('/', authMiddleware, dashboardController.index);
