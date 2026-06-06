import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'
import User, { UserRole, type IUser } from '~/server/models/User'

const JWT_EXPIRES_IN = '7d'

export function generateToken(userId: string, role: string): string {
  const config = useRuntimeConfig()
  return jwt.sign(
    { userId, role },
    config.jwtSecret,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function verifyToken(token: string): any {
  const config = useRuntimeConfig()
  try {
    return jwt.verify(token, config.jwtSecret)
  } catch (error) {
    return null
  }
}

export async function getCurrentUser(event: H3Event): Promise<IUser | null> {
  const token = getCookie(event, 'auth_token')
  if (!token) return null
  
  const decoded = verifyToken(token)
  if (!decoded) return null
  
  const user = await User.findById(decoded.userId).select('-password')
  return user
}

export function requireAuth(handler: (event: H3Event, user: IUser) => Promise<any>) {
  return defineEventHandler(async (event) => {
    const user = await getCurrentUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        message: '未登录或登录已过期'
      })
    }
    return handler(event, user)
  })
}

export function requireRoles(roles: UserRole[], handler: (event: H3Event, user: IUser) => Promise<any>) {
  return defineEventHandler(async (event) => {
    const user = await getCurrentUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        message: '未登录或登录已过期'
      })
    }
    
    if (!roles.includes(user.role)) {
      throw createError({
        statusCode: 403,
        message: '权限不足'
      })
    }
    
    return handler(event, user)
  })
}

export function generateTaskNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `W${year}${month}${day}-${random}`
}
