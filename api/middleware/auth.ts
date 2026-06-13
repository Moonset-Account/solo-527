import { type Request, type Response, type NextFunction } from 'express'
import { verifyToken } from '../lib/auth.js'
import { createError } from '../lib/errors.js'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        username: string
        role: string
        storeId: number
      }
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createError('AUTH_FAILED', '缺少认证令牌'))
  }

  const token = authHeader.slice(7)
  try {
    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch {
    next(createError('TOKEN_EXPIRED'))
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    return next(createError('FORBIDDEN'))
  }
  next()
}
