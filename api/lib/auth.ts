import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'it-duty-system-secret-key-2024'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: { id: number; username: string; role: string; storeId: number }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): { id: number; username: string; role: string; storeId: number } {
  return jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string; storeId: number }
}
