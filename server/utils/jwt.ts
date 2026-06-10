import { createHmac } from 'node:crypto'

const JWT_SECRET = 'qinghe-jwt-secret-key-2026'
const TOKEN_EXPIRE = 7 * 24 * 60 * 60 * 1000

export interface JwtPayload {
  userId: string
  username: string
  role: string
  realName?: string
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return Buffer.from(str, 'base64').toString('utf8')
}

export function signToken(payload: JwtPayload): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Date.now()
  const data = {
    ...payload,
    iat: now,
    exp: now + TOKEN_EXPIRE,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(data))
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function verifyToken(token: string): JwtPayload & { iat: number; exp: number } | null {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.')
    if (!encodedHeader || !encodedPayload || !signature) return null

    const expectedSignature = createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    if (signature !== expectedSignature) return null

    const payload = JSON.parse(base64UrlDecode(encodedPayload))
    if (payload.exp && payload.exp < Date.now()) return null

    return payload
  } catch {
    return null
  }
}

export function getTokenFromEvent(event: any): string | null {
  const authHeader = getHeader(event, 'authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return null
}
