import { adminRoutes } from './routes/admin.routes'
import { educationRoutes } from './routes/education.routes'
import express from 'express'
import cors from 'cors'
import { env } from './config/env'
import { authRoutes } from './routes/auth.routes'
import { userRoutes } from './routes/user.routes'
import { dashboardRoutes } from './routes/dashboard.routes'
import { classroomRoutes } from './routes/classroom.routes'
import { materialRoutes } from './routes/material.routes'
import { errorMiddleware } from './middlewares/error.middleware'
import { aiRoutes } from './routes/ai.routes'
import { browserSecurity, rateLimit } from './middlewares/security.middleware'
import { prisma } from './config/prisma'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', env.trustProxy)
  app.use(browserSecurity)

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  )
  app.use(rateLimit(600))
  app.use(express.json({ limit: '35mb' }))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })
  app.get('/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      res.json({ status: 'ready' })
    } catch { res.status(503).json({ error: 'Banco indisponível' }) }
  })

  app.use('/admin', adminRoutes)
  app.use('/internal/ai', aiRoutes)
  app.use('/education', educationRoutes)
  app.use('/auth', authRoutes)
  app.use('/users', userRoutes)
  app.use('/dashboard', dashboardRoutes)
  app.use('/classrooms', classroomRoutes)
  app.use('/materials', materialRoutes)

  app.use(errorMiddleware)

  return app
}
