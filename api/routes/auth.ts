import { Router, type Request, type Response } from 'express'
import { getDataStore } from '../data/store.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body
    const store = getDataStore()
    
    const user = store.users.find(u => u.email === email)
    
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }

    const isValidPassword = password === 'demo123'
    
    if (!isValidPassword) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        athleteId: user.athleteId,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Login failed' })
  }
})

router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Logged out successfully' })
})

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, error: 'Registration not available in demo mode' })
})

export default router
