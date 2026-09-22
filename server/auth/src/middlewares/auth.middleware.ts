import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { RoleSchema } from '../schemas/Enums.schema';

function getCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const target = `${name}=`;
  const found = cookies.find((cookie) => cookie.startsWith(target));
  return found ? decodeURIComponent(found.slice(target.length)) : null;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith('Bearer ') ? header.replace('Bearer ', '') : null;
  let token: string | null;
  try { token = bearerToken ?? getCookieValue(req.headers.cookie, env.cookieName); }
  catch { res.status(401).json({ error: 'Sessão inválida. Entre novamente.' }); return; }
  if (!token) { res.status(401).json({ error: 'Entre para continuar.' }); return; }
  try { req.user = verifyToken(token); }
  catch { res.status(401).json({ error: 'Sessão expirada ou inválida.' }); return; }
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user.sub, role: { in: RoleSchema.options } },
      select: { id: true, isActive: true, sessionVersion: true },
    });
    if (!user || user.isActive === false || (user.sessionVersion ?? 0) !== (req.user.version ?? 0)) {
      res.status(401).json({ error: 'Conta sem acesso. Entre com uma conta válida.' });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}
