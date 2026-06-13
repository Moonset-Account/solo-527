const prisma = require('../utils/prisma')
const { success, error } = require('../utils/response')

const getLevels = async (req, res) => {
  try {
    const levels = await prisma.approvalLevel.findMany({
      orderBy: { level: 'asc' },
    })
    success(res, levels)
  } catch (e) {
    error(res, e.message)
  }
}

const createLevel = async (req, res) => {
  try {
    const { level, name, role, minAmount, maxAmount, enabled } = req.body
    const existing = await prisma.approvalLevel.findUnique({ where: { level: parseInt(level) } })
    if (existing) {
      return error(res, '该层级已存在', 400)
    }
    const newLevel = await prisma.approvalLevel.create({
      data: {
        level: parseInt(level),
        name,
        role,
        minAmount: parseFloat(minAmount),
        maxAmount: parseFloat(maxAmount),
        enabled: enabled !== undefined ? enabled : true,
      },
    })
    success(res, newLevel, '创建成功')
  } catch (e) {
    error(res, e.message)
  }
}

const updateLevel = async (req, res) => {
  try {
    const { id } = req.params
    const { name, role, minAmount, maxAmount, enabled } = req.body
    const level = await prisma.approvalLevel.update({
      where: { id: parseInt(id) },
      data: {
        name,
        role,
        minAmount: parseFloat(minAmount),
        maxAmount: parseFloat(maxAmount),
        enabled,
      },
    })
    success(res, level, '更新成功')
  } catch (e) {
    error(res, e.message)
  }
}

const deleteLevel = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.approvalLevel.delete({ where: { id: parseInt(id) } })
    success(res, null, '删除成功')
  } catch (e) {
    error(res, e.message)
  }
}

const getMyApprovals = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query
    const where = {
      approver: { role: req.user.role },
    }
    if (status) where.status = status

    const [approvals, total] = await Promise.all([
      prisma.approvalRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          request: {
            include: {
              requester: { select: { realName: true, department: true } },
              items: true,
            },
          },
          approver: { select: { realName: true, role: true } },
        },
      }),
      prisma.approvalRecord.count({ where }),
    ])

    success(res, { list: approvals, total, page: parseInt(page), pageSize: parseInt(pageSize) })
  } catch (e) {
    error(res, e.message)
  }
}

const approve = async (req, res) => {
  try {
    const { id } = req.params
    const { comment } = req.body

    const record = await prisma.approvalRecord.findUnique({
      where: { id: parseInt(id) },
      include: { request: true },
    })

    if (!record) {
      return error(res, '审批记录不存在', 404)
    }

    if (record.status !== 'pending') {
      return error(res, '该审批已处理', 400)
    }

    const level = await prisma.approvalLevel.findFirst({
      where: { level: record.level },
    })

    if (level && level.role !== req.user.role) {
      return error(res, '您没有该层级的审批权限', 403)
    }

    const nextLevel = await prisma.approvalLevel.findFirst({
      where: {
        enabled: true,
        level: { gt: record.level },
        minAmount: { lte: record.request.totalAmount },
        maxAmount: { gte: record.request.totalAmount },
      },
      orderBy: { level: 'asc' },
    })

    await prisma.approvalRecord.update({
      where: { id: parseInt(id) },
      data: {
        status: 'approved',
        approverId: req.user.id,
        comment,
        approvedAt: new Date(),
      },
    })

    let requestStatus = 'approved'
    let nextLevelNum = record.level

    if (nextLevel) {
      requestStatus = 'pending'
      nextLevelNum = nextLevel.level
      await prisma.approvalRecord.create({
        data: {
          requestId: record.requestId,
          level: nextLevel.level,
          status: 'pending',
        },
      })
    }

    await prisma.purchaseRequest.update({
      where: { id: record.requestId },
      data: {
        status: requestStatus,
        currentLevel: nextLevelNum,
      },
    })

    success(res, null, '审批通过')
  } catch (e) {
    error(res, e.message)
  }
}

const reject = async (req, res) => {
  try {
    const { id } = req.params
    const { comment } = req.body

    const record = await prisma.approvalRecord.findUnique({
      where: { id: parseInt(id) },
      include: { request: true },
    })

    if (!record) {
      return error(res, '审批记录不存在', 404)
    }

    if (record.status !== 'pending') {
      return error(res, '该审批已处理', 400)
    }

    const level = await prisma.approvalLevel.findFirst({
      where: { level: record.level },
    })

    if (level && level.role !== req.user.role) {
      return error(res, '您没有该层级的审批权限', 403)
    }

    await prisma.approvalRecord.update({
      where: { id: parseInt(id) },
      data: {
        status: 'rejected',
        approverId: req.user.id,
        comment,
        approvedAt: new Date(),
      },
    })

    await prisma.purchaseRequest.update({
      where: { id: record.requestId },
      data: { status: 'rejected' },
    })

    success(res, null, '已驳回')
  } catch (e) {
    error(res, e.message)
  }
}

module.exports = {
  getLevels,
  createLevel,
  updateLevel,
  deleteLevel,
  getMyApprovals,
  approve,
  reject,
}
