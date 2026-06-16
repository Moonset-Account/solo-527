import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../prisma.js'
import { generateToken, authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    return res.json({ code: 1, message: '用户名或密码错误' })
  }
  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return res.json({ code: 1, message: '用户名或密码错误' })
  }
  const token = generateToken(user)
  res.json({
    code: 0,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      }
    }
  })
})

router.get('/profile', authMiddleware, async (req, res) => {
  const user = req.user
  res.json({
    code: 0,
    data: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      email: user.email
    }
  })
})

export default router
