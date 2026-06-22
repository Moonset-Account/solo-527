import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import type { JwtVariables } from 'hono/jwt';

type Variables = JwtVariables & {
  user: {
    id: number;
    username: string;
    role: string;
    name: string;
  };
};

export const authMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  try {
    const token = getCookie(c, 'token') || c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const payload = await verify(token, process.env.JWT_SECRET || 'secret', 'HS256');
    c.set('jwtPayload', payload as any);

    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

export const requireRole = (roles: string[]) => createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const payload = c.get('jwtPayload');
  if (!payload || !roles.includes((payload as any).role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  await next();
});
