import { createMiddleware } from 'hono/factory';
import { verifyToken, type JWTPayload } from '../utils/auth';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface Env {
  Variables: {
    user?: JWTPayload & { isVerified: boolean };
  };
}

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未授权访问' }, 401);
  }

  const token = authHeader.substring(7);
  try {
    const payload = await verifyToken(token);
    const userRecord = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    if (userRecord.length === 0) {
      return c.json({ error: '用户不存在' }, 401);
    }
    c.set('user', { ...payload, isVerified: userRecord[0].isVerified });
    await next();
  } catch (e) {
    return c.json({ error: '无效的令牌' }, 401);
  }
});

export const adminMiddleware = createMiddleware<Env>(async (c, next) => {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ error: '需要管理员权限' }, 403);
  }
  await next();
});

export const staffMiddleware = createMiddleware<Env>(async (c, next) => {
  const user = c.get('user');
  if (!user || (user.role !== 'admin' && user.role !== 'box_office')) {
    return c.json({ error: '需要工作人员权限' }, 403);
  }
  await next();
});
