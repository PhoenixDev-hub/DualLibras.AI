import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const userRoutes = Router();

userRoutes.get('/me', authMiddleware, userController.me);
