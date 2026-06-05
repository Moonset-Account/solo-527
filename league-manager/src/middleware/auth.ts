import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from '@/lib/auth';

export function extractUser(request: NextRequest): TokenPayload | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function requireRole(...roles: string[]) {
  return (request: NextRequest): NextResponse | null => {
    const user = extractUser(request);
    if (!user) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 });
    }
    if (!roles.includes(user.role)) {
      return NextResponse.json({ error: '权限不足，无法访问该资源' }, { status: 403 });
    }
    return null;
  };
}
