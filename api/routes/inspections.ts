import { Router, type Request, type Response, type NextFunction } from 'express'
import prisma from '../lib/prisma.js'
import { createError } from '../lib/errors.js'
import { logAudit } from '../lib/audit.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/plans', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20

    const [total, items] = await Promise.all([
      prisma.inspectionPlan.count(),
      prisma.inspectionPlan.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: { select: { id: true, displayName: true } },
        },
      }),
    ])

    res.json({ data: { items, total, page, pageSize } })
  } catch (err) {
    next(err)
  }
})

router.post('/plans', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, frequency, assigneeId } = req.body
    if (!name || !assigneeId) return next(createError('VALIDATION_ERROR', '计划名称和负责人为必填项'))

    const plan = await prisma.inspectionPlan.create({
      data: {
        name,
        frequency: frequency || 'weekly',
        assigneeId,
      },
    })

    await logAudit({
      operatorId: req.user!.id,
      action: 'create_inspection_plan',
      entityType: 'inspection_plan',
      entityId: plan.id,
      detail: name,
    })

    res.status(201).json({ data: plan })
  } catch (err) {
    next(err)
  }
})

router.get('/plans/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const plan = await prisma.inspectionPlan.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, displayName: true } },
        tasks: {
          orderBy: { scheduledDate: 'desc' },
          include: {
            assignee: { select: { id: true, displayName: true } },
          },
        },
      },
    })
    if (!plan) return next(createError('NOT_FOUND', '巡检计划不存在或已删除'))
    res.json({ data: plan })
  } catch (err) {
    next(err)
  }
})

router.delete('/plans/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const existing = await prisma.inspectionPlan.findUnique({ where: { id } })
    if (!existing) return next(createError('NOT_FOUND', '巡检计划不存在或已删除'))

    const pendingTaskCount = await prisma.inspectionTask.count({
      where: { planId: id, status: 'pending' },
    })
    if (pendingTaskCount > 0) {
      return next(createError('INVALID_STATE', `存在 ${pendingTaskCount} 个待执行任务，请先处理后再删除`))
    }

    await prisma.$transaction([
      prisma.inspectionTask.deleteMany({ where: { planId: id } }),
      prisma.inspectionPlan.delete({ where: { id } }),
    ])

    await logAudit({
      operatorId: req.user!.id,
      action: 'delete_inspection_plan',
      entityType: 'inspection_plan',
      entityId: id,
      detail: existing.name,
    })

    res.json({ data: { id } })
  } catch (err) {
    next(err)
  }
})

router.post('/plans/:id/generate-tasks', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { startDate, count, assigneeId } = req.body
    if (!startDate || !count) return next(createError('VALIDATION_ERROR', '开始日期和生成数量为必填项'))

    const plan = await prisma.inspectionPlan.findUnique({ where: { id } })
    if (!plan) return next(createError('NOT_FOUND', '巡检计划不存在或已删除'))

    const start = new Date(startDate)
    const actualAssignee = assigneeId || plan.assigneeId

    const tasksData: Array<{ planId: number; assigneeId: number; scheduledDate: Date }> = []
    for (let i = 0; i < count; i++) {
      const d = new Date(start)
      if (plan.frequency === 'daily') d.setDate(d.getDate() + i)
      else if (plan.frequency === 'weekly') d.setDate(d.getDate() + i * 7)
      else if (plan.frequency === 'monthly') d.setMonth(d.getMonth() + i)
      tasksData.push({ planId: id, assigneeId: actualAssignee, scheduledDate: d })
    }

    await prisma.inspectionTask.createMany({ data: tasksData })
    const tasks = await prisma.inspectionTask.findMany({
      where: { planId: id, scheduledDate: { gte: start, lt: new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000) } },
      orderBy: { scheduledDate: 'asc' },
    })

    await logAudit({
      operatorId: req.user!.id,
      action: 'generate_inspection_tasks',
      entityType: 'inspection_plan',
      entityId: id,
      detail: `生成了 ${tasks.length} 个巡检任务`,
    })

    res.status(201).json({ data: tasks })
  } catch (err) {
    next(err)
  }
})

router.put('/plans/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const existing = await prisma.inspectionPlan.findUnique({ where: { id } })
    if (!existing) return next(createError('NOT_FOUND'))

    const { name, frequency, assigneeId } = req.body
    const plan = await prisma.inspectionPlan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(frequency !== undefined && { frequency }),
        ...(assigneeId !== undefined && { assigneeId }),
      },
    })

    await logAudit({
      operatorId: req.user!.id,
      action: 'update_inspection_plan',
      entityType: 'inspection_plan',
      entityId: id,
      detail: JSON.stringify({ name, frequency, assigneeId }),
    })

    res.json({ data: plan })
  } catch (err) {
    next(err)
  }
})

router.get('/tasks', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const planId = req.query.planId as string
    const status = req.query.status as string
    const assigneeId = req.query.assigneeId as string

    const where: Record<string, unknown> = {}
    if (planId) where.planId = parseInt(planId)
    if (status) where.status = status
    if (assigneeId) where.assigneeId = parseInt(assigneeId)

    const items = await prisma.inspectionTask.findMany({
      where,
      orderBy: { scheduledDate: 'desc' },
      include: {
        plan: { select: { id: true, name: true } },
        assignee: { select: { id: true, displayName: true } },
      },
    })

    res.json({ data: items })
  } catch (err) {
    next(err)
  }
})

router.get('/tasks/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const task = await prisma.inspectionTask.findUnique({
      where: { id },
      include: {
        plan: true,
        assignee: { select: { id: true, displayName: true } },
        processRecords: {
          include: { operator: { select: { id: true, displayName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!task) return next(createError('NOT_FOUND', '巡检任务不存在或已删除'))
    res.json({ data: task })
  } catch (err) {
    next(err)
  }
})

router.put('/tasks/:id/execute', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { result, note } = req.body
    if (!result) return next(createError('VALIDATION_ERROR', '巡检结果为必填项'))

    const existing = await prisma.inspectionTask.findUnique({ where: { id } })
    if (!existing) return next(createError('NOT_FOUND'))

    const now = new Date()
    const duration = existing.scheduledDate ? Math.round((now.getTime() - new Date(existing.scheduledDate).getTime()) / 60000) : null

    const task = await prisma.inspectionTask.update({
      where: { id },
      data: {
        status: result === 'normal' ? 'completed' : 'abnormal',
        result,
        note,
        executedAt: now,
      },
    })

    await prisma.processRecord.create({
      data: {
        ticketType: 'inspection_task',
        ticketId: id,
        action: 'executed',
        operatorId: req.user!.id,
        note: note || result,
        duration,
        inspectionTaskId: id,
      },
    })

    if (result === 'abnormal') {
      await prisma.alert.create({
        data: {
          title: `巡检异常: ${existing.planId}`,
          level: 'warning',
          source: 'inspection',
          description: note || '巡检发现异常',
          status: 'pending',
          dutyStaffId: req.user!.id,
        },
      })
    }

    res.json({ data: task })
  } catch (err) {
    next(err)
  }
})

export default router
