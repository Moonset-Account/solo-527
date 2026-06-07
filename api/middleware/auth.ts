import type { Request, Response, NextFunction } from 'express';
import { getUserById } from '../db/index.js';
import type { User } from '../../src/types';

const TOKEN_STORAGE = new Map<string, { userId: string; expiresAt: number }>();

export function generateToken(userId: string): string {
  const token = Math.random().toString(36).substring(2, 32);
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  TOKEN_STORAGE.set(token, { userId, expiresAt });
  return token;
}

export function invalidateToken(token: string): void {
  TOKEN_STORAGE.delete(token);
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: '未提供认证令牌',
    });
    return;
  }

  const tokenData = TOKEN_STORAGE.get(token);
  if (!tokenData) {
    res.status(401).json({
      success: false,
      error: '认证令牌无效',
    });
    return;
  }

  if (tokenData.expiresAt < Date.now()) {
    TOKEN_STORAGE.delete(token);
    res.status(401).json({
      success: false,
      error: '认证令牌已过期',
    });
    return;
  }

  const user = getUserById(tokenData.userId);
  if (!user) {
    res.status(401).json({
      success: false,
      error: '用户不存在',
    });
    return;
  }

  req.user = user;
  next();
}

export function adminOnly(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: '未认证',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: '需要管理员权限',
    });
    return;
  }

  next();
}

export function getOrganizationFilter(
  req: AuthenticatedRequest
): string | null {
  if (!req.user) return null;
  if (req.user.role === 'admin') return null;
  return req.user.organization;
}
