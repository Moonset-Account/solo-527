import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function signToken(payload: { userId: string; role: string }): string {
  const config = useRuntimeConfig()
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const config = useRuntimeConfig()
    return jwt.verify(token, config.jwtSecret) as { userId: string; role: string }
  } catch {
    return null
  }
}

export function getTokenFromHeader(event: H3Event): string | null {
  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export async function requireAuth(event: H3Event) {
  const token = getTokenFromHeader(event)
  if (!token) {
    throw createError({ statusCode: 401, message: '未授权访问' })
  }
  const payload = verifyToken(token)
  if (!payload) {
    throw createError({ statusCode: 401, message: '令牌无效或已过期' })
  }
  const db = useDB()
  const user = await db.user.findUnique({ where: { id: payload.userId } })
  if (!user) {
    throw createError({ statusCode: 401, message: '用户不存在' })
  }
  return user
}
