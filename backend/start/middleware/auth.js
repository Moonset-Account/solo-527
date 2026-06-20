import jsonwebtoken from 'jsonwebtoken'
import models from '../../app/Models/index.js'

const { User } = models

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 1,
      message: '未提供认证令牌',
    })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jsonwebtoken.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    )

    const user = await User.findByPk(decoded.id)

    if (!user) {
      return res.status(401).json({
        code: 1,
        message: '认证令牌无效',
      })
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        code: 1,
        message: '用户已被禁用',
      })
    }

    req.user = user

    next()
  } catch (error) {
    return res.status(401).json({
      code: 1,
      message: '认证令牌无效或已过期',
    })
  }
}

export async function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      code: 1,
      message: '未认证',
    })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      code: 1,
      message: '权限不足',
    })
  }

  next()
}

export default authMiddleware
