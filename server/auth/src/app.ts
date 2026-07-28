import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { errorMiddleware } from './middlewares/error.middleware';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);

  app.use(errorMiddleware);

  return app;
}
