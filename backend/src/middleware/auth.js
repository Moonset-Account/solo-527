const jwt = require('jsonwebtoken')
const prisma = require('../utils/prisma')

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' })
    }
    
    req.user = { id: user.id, username: user.username, role: user.role, realName: user.realName }
    next()
  } catch (error) {
    return res.status(401).json({ code: 401, message: '登录已过期' })
  }
}

const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: '无权限访问' })
    }
    next()
  }
}

module.exports = { authMiddleware, roleMiddleware }
