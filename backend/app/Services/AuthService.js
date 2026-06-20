import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import models from '../Models/index.js'

const { User } = models

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function login(username, password) {
  const user = await User.findOne({ where: { username } })

  if (!user) {
    throw new Error('用户名或密码错误')
  }

  const isPasswordValid = await user.comparePassword(password)
  if (!isPasswordValid) {
    throw new Error('用户名或密码错误')
  }

  if (user.status !== 'active') {
    throw new Error('账户已被禁用')
  }

  const payload = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  }

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone,
      email: user.email,
      status: user.status,
    },
  }
}

export async function getCurrentUser(userId) {
  const user = await User.findByPk(userId)

  if (!user) {
    throw new Error('用户不存在')
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    phone: user.phone,
    email: user.email,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export default {
  login,
  getCurrentUser,
}
