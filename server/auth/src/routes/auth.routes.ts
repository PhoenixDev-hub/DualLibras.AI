import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { validate } from '../middlewares/validate.middleware'
import { loginSchema, registerSchema } from '../schemas/Auth.schema'
import { rateLimit } from '../middlewares/security.middleware'
import { authMiddleware } from '../middlewares/auth.middleware'
import { env } from '../config/env'

export const authRoutes = Router()

authRoutes.post('/cadastro', rateLimit(env.signupLimit, 900000), validate(registerSchema), authController.register)
authRoutes.post('/login', rateLimit(env.loginLimit, 900000), validate(loginSchema), authController.login)
authRoutes.post('/logout', authMiddleware, authController.logout)
