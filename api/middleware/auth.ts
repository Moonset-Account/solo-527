import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload, Role } from '#shared/types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const JWT_SECRET: string = process.env.JWT_SECRET || 'dev-secret-change-me';

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, error: '未登录，缺少认证令牌' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: '登录状态已失效，请重新登录' });
  }
}

const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 4,
  manager: 3,
  reviewer: 2,
  member: 1,
};

export function requireRole(...requiredRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: '未登录，缺少认证令牌' });
      return;
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] ?? 0;
    const hasPermission = requiredRoles.some((role) => {
      const requiredLevel = ROLE_HIERARCHY[role] ?? 999;
      return userLevel >= requiredLevel;
    });

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: `权限不足，需要以下角色之一：${requiredRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

export function signToken(payload: JwtPayload, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn } as jwt.SignOptions);
}

export default { authenticateToken, requireRole, signToken };
