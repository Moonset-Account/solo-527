import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

const JWT_SECRET = process.env.JWT_SECRET || 'aquaculture-monitor-jwt-secret-2024'
const JWT_EXPIRES_IN = '24h'

export interface JwtPayload {
  userId: string
  username: string
  displayName: string
  role: 'technician' | 'manager' | 'admin'
  pondScope: string[] | null
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  let token: string | null = null

  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) {
    token = header.substring(7)
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token
  }

  if (!token) {
    res.status(401).json({ success: false, error: '未提供认证令牌' })
    return
  }

  const payload = verifyToken(token)
  if (!payload) {
    res.status(401).json({ success: false, error: '认证令牌无效或已过期' })
    return
  }

  ;(req as any).user = payload
  next()
}

type Role = 'technician' | 'manager' | 'admin'

const ROLE_HIERARCHY: Record<Role, number> = {
  technician: 1,
  manager: 2,
  admin: 3,
}

export function requireRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as JwtPayload | undefined
    if (!user) {
      res.status(401).json({ success: false, error: '未认证' })
      return
    }

    if (ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[minRole]) {
      res.status(403).json({ success: false, error: '权限不足' })
      return
    }

    next()
  }
}

export function requirePondAccess(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user as JwtPayload | undefined
  if (!user) {
    res.status(401).json({ success: false, error: '未认证' })
    return
  }

  if (user.role === 'admin' || user.role === 'manager') {
    next()
    return
  }

  const pondId = req.query.pondId || req.params.pondId || req.body.pondId
  if (!pondId) {
    next()
    return
  }

  if (user.pondScope && !user.pondScope.includes(pondId)) {
    res.status(403).json({ success: false, error: '无权访问该塘口数据' })
    return
  }

  next()
}
