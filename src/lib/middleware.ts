import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'
import { UserRole } from '@/generated/prisma'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
    role: string
  }
}

export function authMiddleware(requiredRoles?: UserRole[]) {
  return (handler: Function) => {
    return async (req: AuthenticatedRequest, ...args: any[]) => {
      const authHeader = req.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')

      if (!token) {
        return NextResponse.json(
          { success: false, error: '未提供认证令牌' },
          { status: 401 }
        )
      }

      const payload = verifyToken(token)
      if (!payload) {
        return NextResponse.json(
          { success: false, error: '认证令牌无效或已过期' },
          { status: 401 }
        )
      }

      if (requiredRoles && !requiredRoles.includes(payload.role as UserRole)) {
        return NextResponse.json(
          { success: false, error: '权限不足' },
          { status: 403 }
        )
      }

      req.user = payload
      return handler(req, ...args)
    }
  }
}

export function getRequestContext(req: NextRequest) {
  const ip = 
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown'
  
  const userAgent = req.headers.get('user-agent') || 'unknown'

  return { ipAddress: ip, userAgent }
}

export function parseSearchParams(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const result: Record<string, any> = {}

  searchParams.forEach((value, key) => {
    if (value === 'true') result[key] = true
    else if (value === 'false') result[key] = false
    else if (!isNaN(Number(value)) && value !== '') result[key] = Number(value)
    else result[key] = value
  })

  return result
}
