import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  cookieName: process.env.AUTH_COOKIE_NAME ?? 'festival_session',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  materialUploadDir: process.env.MATERIAL_UPLOAD_DIR ?? './uploads/materials',
  materialMaxBytes: Number(process.env.MATERIAL_MAX_BYTES ?? 25 * 1024 * 1024),
  aiBackendUrl: process.env.AI_BACKEND_URL ?? 'http://localhost:5455',
};
