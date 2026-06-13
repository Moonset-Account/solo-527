const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../utils/prisma')
const { success, error } = require('../utils/response')

const login = async (req, res) => {
  try {
    const { username, password } = req.body
    
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return error(res, '用户名或密码错误', 400)
    }
    
    const valid = bcrypt.compareSync(password, user.password)
    if (!valid) {
      return error(res, '用户名或密码错误', 400)
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        role: user.role,
        department: user.department,
      },
    })
  } catch (e) {
    error(res, e.message)
  }
}

const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
        department: true,
        phone: true,
        email: true,
      },
    })
    success(res, user)
  } catch (e) {
    error(res, e.message)
  }
}

module.exports = { login, getCurrentUser }
