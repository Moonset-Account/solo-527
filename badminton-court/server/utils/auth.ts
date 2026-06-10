import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'
import prisma from './prisma'
import type { Role } from '@prisma/client'

const config = useRuntimeConfig()

export const hashPassword = (password: string): string => {
  return bcrypt.hashSync(password, 10)
}

export const comparePassword = (password: string, hash: string): boolean => {
  return bcrypt.compareSync(password, hash)
}

export const generateToken = (payload: { userId: number; role: Role }): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  })
}

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, config.jwtSecret) as { userId: number; role: Role; iat: number; exp: number }
  } catch {
    return null
  }
}

export const getAuthUser = async (event: H3Event) => {
  const authHeader = getHeader(event, 'Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.slice(7)
  const decoded = verifyToken(token)
  if (!decoded) return null
  
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { coachProfile: true }
  })
  if (!user || user.status !== 1) return null
  
  return user
}

export const requireAuth = async (event: H3Event, roles?: Role[]) => {
  const user = await getAuthUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: '未登录或登录已过期'
    })
  }
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: '权限不足'
    })
  }
  event.context.auth = user
  return user
}

export const checkPermission = async (userId: number, permissionCode: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return false
  if (user.role === 'SUPER_ADMIN') return true
  
  const perm = await prisma.rolePermission.findFirst({
    where: {
      role: user.role,
      permission: { code: permissionCode }
    },
    include: { permission: true }
  })
  return !!perm
}

export type AuthUser = Awaited<ReturnType<typeof getAuthUser>>
