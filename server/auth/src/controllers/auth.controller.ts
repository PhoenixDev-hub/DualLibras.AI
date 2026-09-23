import type { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service'
import { env } from '../config/env'
import { prisma } from '../config/prisma'

function setAuthCookie(res: Response, token: string) {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body)
      setAuthCookie(res, result.token)
      res.status(201).json({ user: result.user })
    } catch (err) {
      next(err)
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body)
      setAuthCookie(res, result.token)
      res.status(200).json({ user: result.user })
    } catch (err) {
      next(err)
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.user.update({ where: { id: req.user!.sub }, data: { sessionVersion: { increment: 1 } } })
      res.clearCookie(env.cookieName, {
        httpOnly: true,
        secure: env.cookieSecure,
        sameSite: 'lax',
        path: '/',
      })
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  },
}
