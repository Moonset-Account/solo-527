import { Router, type Request, type Response, type NextFunction } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const ticketType = req.query.ticketType as string
    const ticketId = req.query.ticketId as string

    const where: Record<string, unknown> = {}
    if (ticketType) where.ticketType = ticketType
    if (ticketId) where.ticketId = parseInt(ticketId)

    if (req.user!.role !== 'admin') {
      where.operatorId = req.user!.id
    }

    const [total, items] = await Promise.all([
      prisma.processRecord.count({ where }),
      prisma.processRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          operator: { select: { id: true, displayName: true } },
        },
      }),
    ])

    res.json({ data: { items, total, page, pageSize } })
  } catch (err) {
    next(err)
  }
})

router.get('/stats', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const where: Record<string, unknown> = { duration: { not: null } }

    if (req.user!.role !== 'admin') {
      where.operatorId = req.user!.id
    }

    const records = await prisma.processRecord.findMany({
      where,
      select: { ticketType: true, action: true, duration: true },
    })

    const statsByType: Record<string, { avgResponseTime: number; avgHandleTime: number; count: number }> = {}

    for (const record of records) {
      if (!statsByType[record.ticketType]) {
        statsByType[record.ticketType] = { avgResponseTime: 0, avgHandleTime: 0, count: 0 }
      }
      const stat = statsByType[record.ticketType]
      stat.count++
      if (record.action === 'confirmed' || record.action === 'approved' || record.action === 'executed') {
        stat.avgHandleTime += record.duration!
      } else {
        stat.avgResponseTime += record.duration!
      }
    }

    for (const key of Object.keys(statsByType)) {
      const stat = statsByType[key]
      stat.avgResponseTime = stat.count > 0 ? Math.round(stat.avgResponseTime / stat.count) : 0
      stat.avgHandleTime = stat.count > 0 ? Math.round(stat.avgHandleTime / stat.count) : 0
    }

    res.json({ data: statsByType })
  } catch (err) {
    next(err)
  }
})

export default router
