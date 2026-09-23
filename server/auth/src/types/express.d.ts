import 'express'
import type { Role } from '../generated/prisma/client'
import type { TokenPayload } from '../utils/jwt'

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload
    authenticatedUser?: { id: string; role: Role; isActive: boolean; sessionVersion: number }
  }
}
