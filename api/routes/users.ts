import { Router, type Request, type Response, type NextFunction } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, displayName: true, role: true, storeId: true },
    })
    res.json({ data: users })
  } catch (err) {
    next(err)
  }
})

router.get('/duty-staff', requireAuth, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const schedules = await prisma.dutySchedule.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: {
        staff: { select: { id: true, username: true, displayName: true, role: true, storeId: true } },
      },
    })

    const dutyStaff = schedules.map(s => ({
      ...s.staff,
      shift: s.shift,
      scheduleId: s.id,
    }))

    res.json({ data: dutyStaff })
  } catch (err) {
    next(err)
  }
})

export default router
