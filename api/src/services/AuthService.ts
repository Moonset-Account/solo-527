import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { query } from '../models/index.js'

export async function findUserByEmail(email: string) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email])
  return result.rows[0] || null
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function generateToken(user: any) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
  }
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any,
  }
  return jwt.sign(payload, process.env.JWT_SECRET!, options)
}

export async function findUserById(id: string) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id])
  return result.rows[0] || null
}
