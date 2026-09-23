import dotenv from 'dotenv'

dotenv.config()

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`)
  }
  return value
}

const production = process.env.NODE_ENV === 'production'
const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map(value => value.trim())
if (corsOrigins.some(origin => !/^https?:\/\/[^/]+$/.test(origin)))
  throw new Error('CORS_ORIGIN deve conter origens HTTP(S) explícitas, separadas por vírgula')
if (production && (!process.env.CORS_ORIGIN || process.env.COOKIE_SECURE === 'false'))
  throw new Error('Produção exige CORS_ORIGIN explícito e cookie seguro')
if (production && (required('JWT_SECRET').length < 32 || required('AI_INTERNAL_TOKEN').length < 32))
  throw new Error('Segredos de produção devem conter pelo menos 32 caracteres aleatórios')

function positive(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback)
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} deve ser inteiro positivo`)
  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigins,
  cookieName: process.env.AUTH_COOKIE_NAME ?? 'festival_session',
  cookieSecure: process.env.COOKIE_SECURE === 'true' || production,
  trustProxy: process.env.TRUST_PROXY === '1' ? 1 : false as false | number,
  loginLimit: positive('AUTH_LOGIN_LIMIT', 20),
  signupLimit: positive('AUTH_SIGNUP_LIMIT', 5),
  joinLimit: positive('CLASSROOM_JOIN_LIMIT', 20),
  materialUploadDir: process.env.MATERIAL_UPLOAD_DIR ?? '../../storage/materials/auth',
  materialMaxBytes: Number(process.env.MATERIAL_MAX_BYTES ?? 25 * 1024 * 1024),
  aiBackendUrl: process.env.AI_BACKEND_URL ?? 'http://localhost:5455',
  aiInternalToken: process.env.AI_INTERNAL_TOKEN ?? '',
}
