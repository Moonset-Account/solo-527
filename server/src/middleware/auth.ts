import { Context, Next } from 'hono';
import { verifyToken } from '../utils/jwt';
import { JwtPayload } from '../utils/jwt';

declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: '未授权访问' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const payload = verifyToken(token);

  if (!payload) {
    return c.json({ success: false, error: 'Token 无效或已过期' }, 401);
  }

  c.set('user', payload);
  await next();
}

export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as JwtPayload;
    if (!user || !roles.includes(user.role)) {
      return c.json({ success: false, error: '权限不足' }, 403);
    }
    await next();
  };
}

export function requireAdminRoles() {
  return requireRole('admin', 'ecommerce');
}
