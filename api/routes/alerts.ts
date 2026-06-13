import { Router, type Request, type Response, type NextFunction } from 'express'
import prisma from '../lib/prisma.js'
import { createError } from '../lib/errors.js'
import { logAudit } from '../lib/audit.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const level = req.query.level as string
    const status = req.query.status as string

    const where: Record<string, unknown> = {}
    if (level) where.level = level
    if (status) where.status = status

    const [total, items] = await Promise.all([
      prisma.alert.count({ where }),
      prisma.alert.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          confirmedByUser: { select: { id: true, displayName: true } },
          escalatedToUser: { select: { id: true, displayName: true } },
          dutyStaff: { select: { id: true, displayName: true } },
        },
      }),
    ])

    res.json({ data: { items, total, page, pageSize } })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const alert = await prisma.alert.findUnique({
      where: { id },
      include: {
        confirmedByUser: { select: { id: true, displayName: true } },
        escalatedToUser: { select: { id: true, displayName: true } },
        dutyStaff: { select: { id: true, displayName: true } },
        processRecords: {
          include: { operator: { select: { id: true, displayName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!alert) return next(createError('NOT_FOUND'))
    res.json({ data: alert })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, level, source, description, dutyStaffId } = req.body
    if (!title || !source) return next(createError('VALIDATION_ERROR', '标题和来源为必填项'))

    const alert = await prisma.alert.create({
      data: {
        title,
        level: level || 'info',
        source,
        description,
        dutyStaffId,
        status: 'pending',
      },
    })

    await prisma.processRecord.create({
      data: {
        ticketType: 'alert',
        ticketId: alert.id,
        action: 'created',
        operatorId: req.user!.id,
        alertId: alert.id,
      },
    })

    res.status(201).json({ data: alert })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/confirm', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { dutyStaffId, note } = req.body

    const existing = await prisma.alert.findUnique({ where: { id } })
    if (!existing) return next(createError('NOT_FOUND', '告警不存在或已被删除'))
    if (existing.status === 'resolved') return next(createError('INVALID_STATE', '该告警已解决，无需重复确认'))
    if (existing.status === 'confirmed') return next(createError('ALREADY_CONFIRMED', '该告警已被确认，请刷新后查看'))

    const now = new Date()
    const duration = existing.createdAt ? Math.round((now.getTime() - existing.createdAt.getTime()) / 60000) : null

    const updateData: Record<string, unknown> = {
      status: 'confirmed',
      confirmedBy: req.user!.id,
      confirmedAt: now,
    }
    if (dutyStaffId) {
      updateData.dutyStaffId = dutyStaffId
    }

    const alert = await prisma.alert.update({
      where: { id },
      data: updateData,
    })

    await prisma.processRecord.create({
      data: {
        ticketType: 'alert',
        ticketId: id,
        action: 'confirmed',
        operatorId: req.user!.id,
        note,
        duration,
        alertId: id,
      },
    })

    if (dutyStaffId) {
      await logAudit({
        operatorId: req.user!.id,
        action: 'confirm_and_assign_alert',
        entityType: 'alert',
        entityId: id,
        detail: `确认告警并指派值班人员ID: ${dutyStaffId}`,
        alertId: id,
      })
    }

    res.json({ data: alert })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/escalate', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { escalatedTo, note } = req.body
    if (!escalatedTo) return next(createError('VALIDATION_ERROR', '升级目标人员为必填项'))

    const existing = await prisma.alert.findUnique({ where: { id } })
    if (!existing) return next(createError('NOT_FOUND'))
    if (existing.status === 'resolved') return next(createError('INVALID_STATE', '已解决的告警不能再升级'))

    const now = new Date()
    const duration = existing.createdAt ? Math.round((now.getTime() - existing.createdAt.getTime()) / 60000) : null

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        status: 'escalated',
        escalatedTo,
        escalatedAt: now,
      },
    })

    await prisma.processRecord.create({
      data: {
        ticketType: 'alert',
        ticketId: id,
        action: 'escalated',
        operatorId: req.user!.id,
        note,
        duration,
        alertId: id,
      },
    })

    await logAudit({
      operatorId: req.user!.id,
      action: 'escalate_alert',
      entityType: 'alert',
      entityId: id,
      detail: note,
      alertId: id,
    })

    res.json({ data: alert })
  } catch (err) {
    next(err)
  }
})

router.put('/:id/assign', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { dutyStaffId, note } = req.body
    if (!dutyStaffId) return next(createError('VALIDATION_ERROR', '值班人员为必填项'))

    const existing = await prisma.alert.findUnique({ where: { id } })
    if (!existing) return next(createError('NOT_FOUND'))
    if (existing.status === 'resolved') return next(createError('INVALID_STATE', '已解决的告警不能再指派'))

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        dutyStaffId,
      },
    })

    await prisma.processRecord.create({
      data: {
        ticketType: 'alert',
        ticketId: id,
        action: 'assigned',
        operatorId: req.user!.id,
        note: note ? `${note} (指派ID:${dutyStaffId})` : `指派给ID:${dutyStaffId}`,
        alertId: id,
      },
    })

    await logAudit({
      operatorId: req.user!.id,
      action: 'assign_alert',
      entityType: 'alert',
      entityId: id,
      detail: `dutyStaffId: ${dutyStaffId}`,
      alertId: id,
    })

    res.json({ data: alert })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/resolve', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { note } = req.body

    const existing = await prisma.alert.findUnique({ where: { id } })
    if (!existing) return next(createError('NOT_FOUND'))
    if (existing.status === 'resolved') return next(createError('ALREADY_PROCESSED'))

    const now = new Date()
    const startAt = existing.confirmedAt || existing.createdAt
    const duration = startAt ? Math.round((now.getTime() - new Date(startAt).getTime()) / 60000) : null

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        status: 'resolved',
        resolvedAt: now,
      },
    })

    await prisma.processRecord.create({
      data: {
        ticketType: 'alert',
        ticketId: id,
        action: 'resolved',
        operatorId: req.user!.id,
        note,
        duration,
        alertId: id,
      },
    })

    res.json({ data: alert })
  } catch (err) {
    next(err)
  }
})

export default router
