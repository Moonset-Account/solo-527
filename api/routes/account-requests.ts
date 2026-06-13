import { Router, type Request, type Response, type NextFunction } from 'express'
import prisma from '../lib/prisma.js'
import { createError } from '../lib/errors.js'
import { logAudit } from '../lib/audit.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const request = await prisma.accountRequest.findUnique({
      where: { id },
      include: {
        applicant: { select: { id: true, displayName: true, storeId: true, store: true } },
        approver: { select: { id: true, displayName: true } },
        dutyStaff: { select: { id: true, displayName: true } },
        processRecords: {
          include: { operator: { select: { id: true, displayName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!request) return next(createError('NOT_FOUND', '账号申请不存在或已删除'))

    if (req.user!.role !== 'admin' && request.applicantId !== req.user!.id && request.dutyStaffId !== req.user!.id) {
      return next(createError('FORBIDDEN', '您没有权限查看此申请详情'))
    }

    res.json({ data: request })
  } catch (err) {
    next(err)
  }
})

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const status = req.query.status as string
    const applicantId = req.query.applicantId as string
    const urgency = req.query.urgency as string

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (applicantId) where.applicantId = parseInt(applicantId)
    if (urgency) where.urgency = urgency

    if (req.user!.role !== 'admin') {
      where.OR = [
        { applicantId: req.user!.id },
        { dutyStaffId: req.user!.id },
      ]
    }

    const [total, items] = await Promise.all([
      prisma.accountRequest.count({ where }),
      prisma.accountRequest.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          applicant: { select: { id: true, displayName: true, storeId: true } },
          approver: { select: { id: true, displayName: true } },
          dutyStaff: { select: { id: true, displayName: true } },
        },
      }),
    ])

    res.json({ data: { items, total, page, pageSize } })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { accountType, purpose, urgency, reason } = req.body
    if (!accountType || !purpose) return next(createError('VALIDATION_ERROR', '账号类型和用途为必填项，请检查后重新提交'))

    if (!['low', 'medium', 'high', 'urgent'].includes(urgency || 'medium')) {
      return next(createError('VALIDATION_ERROR', '紧急度参数无效，可选值：low(低)、medium(中)、high(高)、urgent(紧急)'))
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dutySchedule = await prisma.dutySchedule.findFirst({
      where: { date: { gte: today, lt: tomorrow } },
      orderBy: { date: 'asc' },
      include: { staff: true },
    })

    if (!dutySchedule) {
      return next(createError('DUTY_NOT_FOUND', '未找到今日值班人员，请先在值班管理中排值班后再提交申请'))
    }

    const request = await prisma.accountRequest.create({
      data: {
        accountType,
        purpose,
        urgency: urgency || 'medium',
        reason,
        applicantId: req.user!.id,
        dutyStaffId: dutySchedule?.staffId,
      },
    })

    await prisma.processRecord.create({
      data: {
        ticketType: 'account_request',
        ticketId: request.id,
        action: 'created',
        operatorId: req.user!.id,
        note: `自动分配值班人员: ${dutySchedule.staff.displayName}`,
        accountRequestId: request.id,
      },
    })

    await logAudit({
      operatorId: req.user!.id,
      action: 'create_account_request',
      entityType: 'account_request',
      entityId: request.id,
      detail: `${accountType} - ${purpose}`,
      accountRequestId: request.id,
    })

    res.status(201).json({ data: request })
  } catch (err) {
    next(err)
  }
})

router.put('/:id/approve', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { approvalNote } = req.body

    const existing = await prisma.accountRequest.findUnique({ where: { id } })
    if (!existing) return next(createError('NOT_FOUND', '该账号申请不存在或已被删除'))
    if (existing.status === 'approved') return next(createError('ALREADY_PROCESSED', '该申请已通过，请勿重复审批'))
    if (existing.status === 'rejected') return next(createError('ALREADY_PROCESSED', '该申请已被驳回，无法再次通过'))
    if (existing.status !== 'pending') return next(createError('INVALID_STATE', '当前状态不允许审批操作'))

    const now = new Date()
    const duration = existing.createdAt ? Math.round((now.getTime() - existing.createdAt.getTime()) / 60000) : null

    const request = await prisma.accountRequest.update({
      where: { id },
      data: {
        status: 'approved',
        approverId: req.user!.id,
        approvalNote,
        approvedAt: now,
        completedAt: now,
      },
    })

    await prisma.processRecord.create({
      data: {
        ticketType: 'account_request',
        ticketId: id,
        action: 'approved',
        operatorId: req.user!.id,
        note: approvalNote,
        duration,
        accountRequestId: id,
      },
    })

    await logAudit({
      operatorId: req.user!.id,
      action: 'approve_account_request',
      entityType: 'account_request',
      entityId: id,
      detail: approvalNote,
      accountRequestId: id,
    })

    res.json({ data: request })
  } catch (err) {
    next(err)
  }
})

router.put('/:id/reject', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { approvalNote } = req.body

    const existing = await prisma.accountRequest.findUnique({ where: { id } })
    if (!existing) return next(createError('NOT_FOUND', '该账号申请不存在或已被删除'))
    if (!approvalNote) return next(createError('VALIDATION_ERROR', '驳回时必须填写驳回原因，请详细说明'))
    if (existing.status === 'approved') return next(createError('ALREADY_PROCESSED', '该申请已通过，无法驳回'))
    if (existing.status === 'rejected') return next(createError('ALREADY_PROCESSED', '该申请已被驳回，请勿重复操作'))
    if (existing.status !== 'pending') return next(createError('INVALID_STATE', '当前状态不允许审批操作'))

    const now = new Date()
    const duration = existing.createdAt ? Math.round((now.getTime() - existing.createdAt.getTime()) / 60000) : null

    const request = await prisma.accountRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        approverId: req.user!.id,
        approvalNote,
        completedAt: now,
      },
    })

    await prisma.processRecord.create({
      data: {
        ticketType: 'account_request',
        ticketId: id,
        action: 'rejected',
        operatorId: req.user!.id,
        note: approvalNote,
        duration,
        accountRequestId: id,
      },
    })

    await logAudit({
      operatorId: req.user!.id,
      action: 'reject_account_request',
      entityType: 'account_request',
      entityId: id,
      detail: approvalNote,
      accountRequestId: id,
    })

    res.json({ data: request })
  } catch (err) {
    next(err)
  }
})

export default router
