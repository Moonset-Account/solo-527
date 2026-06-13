import { Router, type Request, type Response, type NextFunction } from 'express'
import prisma from '../lib/prisma.js'
import { createError } from '../lib/errors.js'
import { logAudit } from '../lib/audit.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const month = req.query.month as string
    const staffId = req.query.staffId as string

    const where: Record<string, unknown> = {}
    if (month) {
      const start = new Date(`${month}-01`)
      const end = new Date(start)
      end.setMonth(end.getMonth() + 1)
      where.date = { gte: start, lt: end }
    }
    if (staffId) where.staffId = parseInt(staffId)

    const items = await prisma.dutySchedule.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        staff: { select: { id: true, displayName: true, storeId: true } },
      },
    })

    res.json({ data: items })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { staffId, date, shift } = req.body
    if (!staffId || !date) return next(createError('VALIDATION_ERROR', '值班人员和日期为必填项'))

    const schedule = await prisma.dutySchedule.create({
      data: {
        staffId,
        date: new Date(date),
        shift: shift || 'morning',
      },
    })

    await logAudit({
      operatorId: req.user!.id,
      action: 'create_duty_schedule',
      entityType: 'duty_schedule',
      entityId: schedule.id,
      detail: `staffId: ${staffId}, date: ${date}, shift: ${shift}`,
    })

    res.status(201).json({ data: schedule })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const existing = await prisma.dutySchedule.findUnique({ where: { id } })
    if (!existing) return next(createError('NOT_FOUND'))

    const { staffId, date, shift } = req.body
    const schedule = await prisma.dutySchedule.update({
      where: { id },
      data: {
        ...(staffId !== undefined && { staffId }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(shift !== undefined && { shift }),
      },
    })

    await logAudit({
      operatorId: req.user!.id,
      action: 'update_duty_schedule',
      entityType: 'duty_schedule',
      entityId: id,
      detail: JSON.stringify({ staffId, date, shift }),
    })

    res.json({ data: schedule })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const existing = await prisma.dutySchedule.findUnique({ where: { id } })
    if (!existing) return next(createError('NOT_FOUND'))

    await prisma.dutySchedule.delete({ where: { id } })

    await logAudit({
      operatorId: req.user!.id,
      action: 'delete_duty_schedule',
      entityType: 'duty_schedule',
      entityId: id,
    })

    res.json({ data: { id } })
  } catch (err) {
    next(err)
  }
})

export default router
