import jwt from 'jsonwebtoken'
import prisma from '../prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'music-event-dashboard-secret-key-2024'

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ code: 401, message: '未登录' })
    }
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' })
    }
    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ code: 401, message: '登录已过期' })
  }
}

export const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: '无权限访问' })
    }
    next()
  }
}
