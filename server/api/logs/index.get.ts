import { prisma } from '../../plugins/prisma'
import { requireAdmin, requireAuth } from '../../utils/auth'
import type { LogActionType } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)

  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 50
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}

  if (query.actionType) {
    where.actionType = query.actionType as LogActionType
  }
  if (query.alertId) {
    where.alertId = parseInt(query.alertId as string)
  }
  if (query.changeId) {
    where.changeId = parseInt(query.changeId as string)
  }
  if (query.userId) {
    where.userId = parseInt(query.userId as string)
  }
  if (query.startDate) {
    where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(query.startDate as string) }
  }
  if (query.endDate) {
    where.createdAt = { ...(where.createdAt as object || {}), lte: new Date(query.endDate as string + ' 23:59:59') }
  }

  if (user.role !== 'ADMIN') {
    where.userId = user.id
  } else {
    await requireAdmin(event)
  }

  const [logs, total] = await Promise.all([
    prisma.operationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        user: { select: { id: true, realName: true, username: true } },
        alert: { select: { id: true, alertNo: true, title: true } },
        changeRequest: { select: { id: true, changeNo: true, title: true } }
      }
    }),
    prisma.operationLog.count({ where })
  ])

  return {
    data: logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
})
