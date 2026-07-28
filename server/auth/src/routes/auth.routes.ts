import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

export const authRoutes = Router();

authRoutes.post('/cadastro', validate(registerSchema), authController.register);
authRoutes.post('/login', validate(loginSchema), authController.login);
