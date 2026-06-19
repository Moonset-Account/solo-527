import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const config = useRuntimeConfig()

const JWT_SECRET = config.jwtSecret
const TOKEN_EXPIRES_IN = '7d'

export const hashPassword = (password: string): string => {
  return bcrypt.hashSync(password, 10)
}

export const verifyPassword = (password: string, hash: string): boolean => {
  return bcrypt.compareSync(password, hash)
}

export const generateToken = (user: { id: string; role: string; name: string }): string => {
  return jwt.sign(
    { userId: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  )
}

export const verifyToken = (token: string): { userId: string; role: string; name: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string; name: string }
    return decoded
  } catch {
    return null
  }
}

export const getCurrentUser = async (event: any) => {
  const token = getCookie(event, 'auth_token')
  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded) return null

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      avatar: true,
    },
  })

  return user
}

export const requireAuth = async (event: any) => {
  const user = await getCurrentUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: '未授权，请先登录',
    })
  }
  return user
}

export const requireRole = async (event: any, roles: string[]) => {
  const user = await requireAuth(event)
  if (!roles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: '权限不足',
    })
  }
  return user
}
