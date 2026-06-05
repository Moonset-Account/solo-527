import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AuthPayload } from '@/lib/auth';
import { Role } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthPayload;
}

export function authenticate(request: NextRequest): AuthPayload | null {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('auth_token')?.value;
  
  let token: string | null = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (cookieToken) {
    token = cookieToken;
  }
  
  if (!token) return null;
  
  return verifyToken(token);
}

export function requireAuth(handler: (request: NextRequest, user: AuthPayload) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    return handler(request, user);
  };
}

export function requireRole(allowedRoles: Role[], handler: (request: NextRequest, user: AuthPayload) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }
    
    return handler(request, user);
  };
}

export function sanitizeForRole(data: any, role: Role): any {
  if (role === Role.CLIENT) {
    const { budget, hourly_rate, created_by, ...sanitized } = data;
    return sanitized;
  }
  return data;
}

export function sanitizeProjectForClient(project: any): any {
  const { budget, hourly_rate, created_by, ...sanitized } = project;
  return sanitized;
}

export function sanitizeTimeEntriesForClient(entries: any[]): any[] {
  return [];
}
