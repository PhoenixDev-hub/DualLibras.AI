import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from './error.middleware';


export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Token não informado', 401));
  }

  const token = header.replace('Bearer ', '');

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new AppError('Token inválido ou expirado', 401));
  }
}
