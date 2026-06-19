import jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  user?: any
}

export function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' })
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: '令牌无效或已过期' })
  }
}
