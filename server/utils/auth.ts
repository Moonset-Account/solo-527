import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'
import { prisma } from './prisma'

export interface AuthUser {
  id: number
  username: string
  name: string
  role: string
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10)
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const generateToken = (user: AuthUser): string => {
  const config = useRuntimeConfig()
  return jwt.sign(user, config.jwtSecret, { expiresIn: '7d' })
}

export const verifyToken = (token: string): AuthUser | null => {
  try {
    const config = useRuntimeConfig()
    return jwt.verify(token, config.jwtSecret) as AuthUser
  } catch {
    return null
  }
}

export const getCurrentUser = (event: H3Event): AuthUser | null => {
  const token = getHeader(event, 'Authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

export const requireAuth = (event: H3Event, roles?: string[]): AuthUser => {
  const user = getCurrentUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: '未登录或登录已过期'
    })
  }

  if (roles && !roles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: '权限不足'
    })
  }

  return user
}
