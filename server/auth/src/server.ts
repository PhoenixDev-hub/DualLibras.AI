import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { logger } from './utils/logger';

async function startServer() {
  try {
    await prisma.$connect();
    logger.info('Successfully connected to the database');

    const app = createApp();
    
    app.listen(env.port, () => {
      logger.info(`Auth Server listening on port ${env.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
