import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Role from '../models/Role.js'
import { redis } from '../db/redis.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'orchard-farm-jwt-secret'

let seedAttempted = false

async function ensureSeed() {
  if (seedAttempted) return
  seedAttempted = true
  try {
    const roleCount = await Role.countDocuments()
    if (roleCount === 0) {
      const adminRole = await Role.create({ name: 'admin', permissions: ['all'] })
      await Role.create({ name: 'operator', permissions: ['farm', 'harvest', 'sorting'] })
      await Role.create({ name: 'viewer', permissions: ['view'] })
      const hashedPassword = await bcrypt.hash('admin123', 10)
      await User.create({
        username: 'admin',
        password: hashedPassword,
        name: '系统管理员',
        role: adminRole._id,
        active: true,
      })
    }
  } catch {}
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureSeed()
    const { username, password, name, role } = req.body
    if (!username || !password || !name) {
      res.status(400).json({ success: false, error: 'Missing required fields' })
      return
    }
    const existing = await User.findOne({ username })
    if (existing) {
      res.status(409).json({ success: false, error: 'Username already exists' })
      return
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    let userRole = role
    if (!userRole) {
      const defaultRole = await Role.findOne({ name: 'operator' })
      userRole = defaultRole?._id
    }
    const user = await User.create({ username, password: hashedPassword, name, role: userRole })
    res.status(201).json({ success: true, data: { id: user._id, username: user.username, name: user.name } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureSeed()
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Missing username or password' })
      return
    }
    const user = await User.findOne({ username }).populate('role')
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }
    const roleDoc = user.role as any
    const payload = { userId: user._id.toString(), username: user.username, role: roleDoc?.name || '' }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
    await redis.set(`session:${user._id}`, token, 'EX', 86400)
    res.json({ success: true, data: { token, user: { id: user._id, username: user.username, name: user.name, role: payload.role } } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/logout', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.userId) {
      await redis.del(`session:${req.user.userId}`)
    }
    res.json({ success: true, data: null })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
