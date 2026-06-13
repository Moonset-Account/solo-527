import { Router, type Request, type Response, type NextFunction } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const operatorId = req.query.operatorId as string
    const action = req.query.action as string
    const entityType = req.query.entityType as string
    const startDate = req.query.startDate as string
    const endDate = req.query.endDate as string

    const where: Record<string, unknown> = {}
    if (operatorId) where.operatorId = parseInt(operatorId)
    if (action) where.action = action
    if (entityType) where.entityType = entityType
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      }
    }

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
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

export default router
