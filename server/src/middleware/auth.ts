import { createMiddleware } from 'hono/factory';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: '未授权访问' }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
    if (!user) {
      return c.json({ error: '用户不存在' }, 401);
    }
    c.set('user', {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });
    await next();
  } catch (e) {
    return c.json({ error: '无效的token' }, 401);
  }
});

export const adminMiddleware = createMiddleware(async (c, next) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: '需要管理员权限' }, 403);
  }
  await next();
});

export function generateToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}
