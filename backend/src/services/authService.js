import jwt from 'jsonwebtoken'
import { User } from '../db/models.js'

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret')
  } catch (error) {
    return null
  }
}

export const login = async (username, password) => {
  const user = await User.findOne({ where: { username } })
  if (!user) {
    throw new Error('用户不存在')
  }

  if (user.status !== 'active') {
    throw new Error('用户已被禁用')
  }

  const isValid = await user.comparePassword(password)
  if (!isValid) {
    throw new Error('密码错误')
  }

  const token = generateToken(user)

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone,
      email: user.email
    }
  }
}

export const getCurrentUser = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'username', 'name', 'role', 'phone', 'email', 'status']
  })
  return user
}
