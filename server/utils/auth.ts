import type { H3Event } from 'h3'
import jwt from 'jsonwebtoken'
import type { Role } from '@prisma/client'
import { prisma } from '../plugins/prisma'

export interface AuthUser {
  id: number
  username: string
  realName: string
  role: Role
  storeCode: string | null
}

const JWT_EXPIRES_IN = '24h'

export function signToken(user: AuthUser): string {
  const config = useRuntimeConfig()
  return jwt.sign(user, config.jwtSecret, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const config = useRuntimeConfig()
    return jwt.verify(token, config.jwtSecret) as AuthUser
  } catch {
    return null
  }
}

export function getTokenFromEvent(event: H3Event): string | null {
  const header = getHeader(event, 'Authorization')
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7)
  }
  const cookies = parseCookies(event)
  return cookies['auth_token'] || null
}

export async function getUserFromEvent(event: H3Event): Promise<AuthUser | null> {
  const token = getTokenFromEvent(event)
  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded) return null

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      storeCode: true,
      isActive: true
    }
  })

  if (!user || !user.isActive) return null
  return {
    id: user.id,
    username: user.username,
    realName: user.realName,
    role: user.role,
    storeCode: user.storeCode
  }
}

export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const user = await getUserFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: '未登录或登录已过期' })
  }
  return user
}

export async function requireRole(event: H3Event, ...roles: Role[]): Promise<AuthUser> {
  const user = await requireAuth(event)
  if (!roles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: '权限不足' })
  }
  return user
}

export async function requireAdmin(event: H3Event): Promise<AuthUser> {
  return requireRole(event, 'ADMIN')
}
