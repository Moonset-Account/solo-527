import type { H3Event } from 'h3'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'sales-portal-secret-key'

export interface AuthUser {
  id: string
  username: string
  name: string
  roleId: string
  role?: string
}

export const generateToken = (user: AuthUser): string => {
  return jwt.sign(
    { id: user.id, username: user.username, name: user.name, roleId: user.roleId },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export const verifyToken = (token: string): AuthUser | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch {
    return null
  }
}

export const getAuthUser = (event: H3Event): AuthUser | null => {
  const token = getCookie(event, 'auth_token') || ''
  if (!token) return null
  return verifyToken(token)
}

export const requireAuth = (event: H3Event): AuthUser => {
  const user = getAuthUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: '未授权访问'
    })
  }
  return user
}

export const setAuthCookie = (event: H3Event, token: string) => {
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax'
  })
}

export const clearAuthCookie = (event: H3Event) => {
  deleteCookie(event, 'auth_token')
}
