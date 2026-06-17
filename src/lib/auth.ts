import { hash, compare } from 'bcryptjs'
import { sign, verify } from 'jsonwebtoken'
import prisma from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
const SALT_ROUNDS = 12

export interface AuthTokenPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash)
}

export function generateToken(payload: AuthTokenPayload): string {
  return sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return verify(token, JWT_SECRET) as AuthTokenPayload
  } catch {
    return null
  }
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ token: string; user: any } | null> {
  const user = await prisma.user.findUnique({
    where: { email, isActive: true },
  })

  if (!user) return null

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) return null

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  return { token, user }
}

export async function getCurrentUser(token: string) {
  const payload = verifyToken(token)
  if (!payload) return null

  return prisma.user.findUnique({
    where: { id: payload.userId, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      avatar: true,
      createdAt: true,
    },
  })
}
