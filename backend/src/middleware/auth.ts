import { sign, verify } from 'hono/jwt';
import type { Context, MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import { createMiddleware } from 'hono/factory';

export const JWT_ACCESS_EXPIRES_IN = '24h';

export interface JwtPayload {
  sub: number;
  username: string;
  role: 'admin' | 'equipment_supervisor' | 'planner';
  realName: string;
  iat?: number;
  exp?: number;
}

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'qinghe-scheduling-jwt-secret-key-change-in-production';
}

export async function generateToken(user: typeof users.$inferSelect): Promise<string> {
  const payload: JwtPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    realName: user.realName,
  };
  return sign(payload, getJwtSecret(), 'HS256');
}

export function jwtAuthMiddleware(): MiddlewareHandler {
  return createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization') || '';
    let token = '';

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const cookieToken = getCookie(c, 'access_token');
      if (cookieToken) token = cookieToken;
    }

    if (!token) {
      return c.json({ error: '未提供认证令牌' }, 401);
    }

    try {
      const payload = (await verify(token, getJwtSecret(), 'HS256')) as JwtPayload;
      const user = await db.query.users.findFirst({ where: eq(users.id, payload.sub) });
      if (!user || !user.isActive) {
        return c.json({ error: '用户不存在或已禁用' }, 401);
      }
      c.set('user', { ...payload, user });
      await next();
    } catch {
      return c.json({ error: '认证令牌无效或已过期' }, 401);
    }
  });
}

export function requireRole(...roles: Array<'admin' | 'equipment_supervisor' | 'planner'>): MiddlewareHandler {
  return createMiddleware(async (c, next) => {
    const user = c.get('user') as JwtPayload | undefined;
    if (!user) {
      return c.json({ error: '未认证' }, 401);
    }
    if (!roles.includes(user.role)) {
      return c.json({ error: '权限不足，需要角色：' + roles.join(' / ') }, 403);
    }
    await next();
  });
}

export function requireAdmin(): MiddlewareHandler {
  return requireRole('admin');
}

export function getCurrentUser(c: Context): JwtPayload & { user?: typeof users.$inferSelect } {
  return c.get('user');
}
