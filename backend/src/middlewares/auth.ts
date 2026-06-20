import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import prisma from '../lib/prisma';
import { Role } from '../types/enums';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('缺少登录凭证');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;

    if (!decoded || !decoded.id) {
      throw new UnauthorizedError('登录凭证无效');
    }

    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
}

export function roleMiddleware(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('请先登录');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `需要${roles.join('或')}权限`,
        '您当前角色无法执行此操作，请联系管理员'
      );
    }

    next();
  };
}

export async function recordLastLogin(userId: number, ip?: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });
  } catch (err) {
    console.error('记录登录信息失败', err);
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}
