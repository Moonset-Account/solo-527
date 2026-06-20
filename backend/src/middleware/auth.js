import { verifyToken } from '../services/authService.js'

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 1,
        message: '未提供认证令牌'
      })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({
        code: 1,
        message: '认证令牌无效或已过期'
      })
    }

    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({
      code: 1,
      message: '认证失败'
    })
  }
}

export const adminMiddleware = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      code: 1,
      message: '权限不足'
    })
  }
  next()
}
