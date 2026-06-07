import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, ROLES } from './auth';
import { dbAnalytics } from './services/db-analytics';

export interface AuthContext {
  userId: string;
  username: string;
  roles: string[];
  permittedClassIds: string[];
  canViewContact: boolean;
  canImportData: boolean;
  canExportData: boolean;
}

export async function getAuthContext(
  request: NextRequest
): Promise<AuthContext | null> {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    const permittedClassIds = await dbAnalytics.getPermittedClassIds(decoded.userId);
    
    const roles = decoded.roles || [];
    const isAdmin = roles.includes(ROLES.ADMIN);
    const isDean = roles.includes(ROLES.DEAN);
    const isHeadTeacher = roles.includes(ROLES.HEAD_TEACHER);

    return {
      userId: decoded.userId,
      username: decoded.username,
      roles,
      permittedClassIds,
      canViewContact: isAdmin || isDean || isHeadTeacher,
      canImportData: isAdmin || isDean,
      canExportData: isAdmin || isDean || isHeadTeacher,
    };
  } catch (error) {
    console.error('Auth context error:', error);
    return null;
  }
}

export function requireAuth(handler: (request: NextRequest, context: AuthContext) => Promise<Response>) {
  return async (request: NextRequest) => {
    const auth = await getAuthContext(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: '未授权，请先登录', success: false },
        { status: 401 }
      );
    }

    return handler(request, auth);
  };
}

export function requirePermission(
  requiredRoles: string[],
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const auth = await getAuthContext(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: '未授权，请先登录', success: false },
        { status: 401 }
      );
    }

    const hasPermission = auth.roles.some((role) => requiredRoles.includes(role));
    if (!hasPermission) {
      return NextResponse.json(
        { error: '权限不足', success: false },
        { status: 403 }
      );
    }

    return handler(request, auth);
  };
}

export function filterByClassPermission<T extends { classId?: string }>(
  data: T[],
  permittedClassIds: string[]
): T[] {
  if (permittedClassIds.length === 0) {
    return [];
  }
  return data.filter((item) => {
    if (!item.classId) return true;
    return permittedClassIds.includes(item.classId);
  });
}
