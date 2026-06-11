import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from './prisma'
import { UserRole } from '@prisma/client'

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 10)
}

export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash)
}

export const generateToken = (userId: string, role: UserRole) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  )
}

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      userId: string
      role: UserRole
    }
  } catch {
    return null
  }
}

export const getCurrentUser = async (headers: Headers) => {
  const authHeader = headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  const payload = verifyToken(token)
  if (!payload) return null

  return prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
    },
  })
}

export const requireAuth = async (headers: Headers) => {
  const user = await getCurrentUser(headers)
  if (!user) {
    throw new Error('未授权访问')
  }
  return user
}

export const requireRole = async (headers: Headers, roles: UserRole[]) => {
  const user = await requireAuth(headers)
  if (!roles.includes(user.role)) {
    throw new Error('权限不足')
  }
  return user
}

export const hasPermission = (userRole: UserRole, allowedRoles: UserRole[]) => {
  return allowedRoles.includes(userRole)
}
