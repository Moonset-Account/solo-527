import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import { getDb } from '../database'
import { signToken, verifyToken, type JwtPayload } from '../authMiddleware'

const router = Router()

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const verify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return verify === hash
}

router.post('/register', (req: Request, res: Response): void => {
  const { username, password, displayName, role, pondScope } = req.body

  if (!username || !password || !displayName) {
    res.status(400).json({ success: false, error: '用户名、密码和显示名称不能为空' })
    return
  }

  if (password.length < 6) {
    res.status(400).json({ success: false, error: '密码至少6位' })
    return
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    res.status(409).json({ success: false, error: '用户名已存在' })
    return
  }

  const validRoles = ['technician', 'manager', 'admin']
  const userRole = validRoles.includes(role) ? role : 'technician'

  const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  const passwordHash = hashPassword(password)

  db.prepare(
    'INSERT INTO users (id, username, password_hash, display_name, role, pond_scope, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))'
  ).run(id, username, passwordHash, displayName, userRole, pondScope || null)

  const payload: JwtPayload = {
    userId: id,
    username,
    displayName,
    role: userRole as JwtPayload['role'],
    pondScope: pondScope ? pondScope.split(',') : null,
  }

  const token = signToken(payload)

  res.status(201).json({
    success: true,
    data: { token, user: { id, username, displayName, role: userRole, pondScope: payload.pondScope } },
  })
})

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ success: false, error: '用户名和密码不能为空' })
    return
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any

  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ success: false, error: '用户名或密码错误' })
    return
  }

  const pondScope = user.pond_scope ? user.pond_scope.split(',') : null

  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    pondScope,
  }

  const token = signToken(payload)

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        pondScope,
      },
    },
  })
})

router.post('/logout', (req: Request, res: Response): void => {
  res.json({ success: true, message: '已退出登录' })
})

router.get('/me', (req: Request, res: Response): void => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未认证' })
    return
  }

  const token = header.substring(7)
  const payload = verifyToken(token)
  if (!payload) {
    res.status(401).json({ success: false, error: '令牌无效或已过期' })
    return
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as any
  if (!user) {
    res.status(401).json({ success: false, error: '用户不存在' })
    return
  }

  const pondScope = user.pond_scope ? user.pond_scope.split(',') : null

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      pondScope,
    },
  })
})

router.get('/users', (req: Request, res: Response): void => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未认证' })
    return
  }

  const token = header.substring(7)
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'admin') {
    res.status(403).json({ success: false, error: '仅管理员可查看用户列表' })
    return
  }

  const db = getDb()
  const users = db.prepare('SELECT id, username, display_name, role, pond_scope, created_at FROM users').all() as any[]

  res.json({
    success: true,
    data: users.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      role: u.role,
      pondScope: u.pond_scope ? u.pond_scope.split(',') : null,
      createdAt: u.created_at,
    })),
  })
})

export default router
