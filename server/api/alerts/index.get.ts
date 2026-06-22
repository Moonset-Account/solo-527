import { prisma } from '../../plugins/prisma'
import { requireAuth } from '../../utils/auth'
import type { AlertLevel, AlertStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)

  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}

  if (query.status) {
    where.status = query.status as AlertStatus
  }
  if (query.level) {
    where.level = query.level as AlertLevel
  }
  if (query.keyword) {
    where.OR = [
      { title: { contains: query.keyword as string } },
      { alertNo: { contains: query.keyword as string } },
      { serverHost: { contains: query.keyword as string } },
      { serverIp: { contains: query.keyword as string } }
    ]
  }
  if (query.startDate) {
    where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(query.startDate as string) }
  }
  if (query.endDate) {
    where.createdAt = { ...(where.createdAt as object || {}), lte: new Date(query.endDate as string + ' 23:59:59') }
  }

  if (user.role === 'STORE_OPERATOR' && user.storeCode) {
    where.OR = [
      { storeCode: user.storeCode },
      { storeCode: null }
    ]
  }

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        reporter: { select: { id: true, realName: true, username: true } },
        acknowledger: { select: { id: true, realName: true, username: true } }
      }
    }),
    prisma.alert.count({ where })
  ])

  return {
    data: alerts,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
})
