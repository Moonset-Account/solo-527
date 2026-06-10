import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

const JWT_SECRET = process.env.JWT_SECRET || 'orchard-farm-jwt-secret'

export interface AuthPayload {
  userId: string
  username: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'No token provided' })
    return
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
}
