import { Router, type Request, type Response, type NextFunction } from 'express'
import prisma from '../lib/prisma.js'
import { createError } from '../lib/errors.js'
import { comparePassword, generateToken } from '../lib/auth.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return next(createError('VALIDATION_ERROR', '用户名和密码为必填项'))
    }

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return next(createError('AUTH_FAILED'))
    }

    const valid = await comparePassword(password, user.password)
    if (!valid) {
      return next(createError('AUTH_FAILED'))
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      storeId: user.storeId,
    })

    res.json({
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          storeId: user.storeId,
        },
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        storeId: true,
        createdAt: true,
        store: { select: { id: true, name: true, address: true } },
      },
    })
    if (!user) return next(createError('NOT_FOUND'))
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
})

export default router
