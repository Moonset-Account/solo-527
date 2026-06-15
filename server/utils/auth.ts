import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'
import prisma from './prisma'

const config = useRuntimeConfig()

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function generateToken(userId: number, role: string): string {
  return jwt.sign(
    { userId, role },
    config.jwtSecret,
    { expiresIn: '7d' }
  )
}

export async function verifyToken(event: H3Event) {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: '未提供认证令牌'
    })
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true }
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '用户不存在'
      })
    }

    return user
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: '认证令牌无效或已过期'
    })
  }
}

export function requireRole(user: any, allowedRoles: string[]) {
  if (!user || !allowedRoles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: '权限不足'
    })
  }
}

export function generateOrderNo(prefix: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}${year}${month}${day}${random}`
}
