import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ success: false, error: '用户名和密码不能为空' })
    return
  }

  const user = db.prepare('SELECT * FROM user WHERE username = ? AND password_hash = ?').get(username, password) as any

  if (!user) {
    res.status(401).json({ success: false, error: '用户名或密码错误' })
    return
  }

  const token = Buffer.from(String(user.id)).toString('base64')

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        email: user.email,
      },
    },
  })
})

router.get('/me', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.status(401).json({ success: false, error: '未提供认证令牌' })
    return
  }

  try {
    const userId = Number(Buffer.from(authHeader, 'base64').toString('utf-8'))
    const user = db.prepare('SELECT * FROM user WHERE id = ?').get(userId) as any

    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        email: user.email,
        createdAt: user.created_at,
      },
    })
  } catch {
    res.status(401).json({ success: false, error: '无效的认证令牌' })
  }
})

export default router
