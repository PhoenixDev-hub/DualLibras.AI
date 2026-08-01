import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from './error.middleware';
import { env } from '../config/env';

function getCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const target = `${name}=`;
  const found = cookies.find((cookie) => cookie.startsWith(target));
  return found ? decodeURIComponent(found.slice(target.length)) : null;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith('Bearer ') ? header.replace('Bearer ', '') : null;
  const cookieToken = getCookieValue(req.headers.cookie, env.cookieName);
  const token = bearerToken ?? cookieToken;

  if (!token) {
    return next(new AppError('Token não informado', 401));
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new AppError('Token inválido ou expirado', 401));
  }
}
