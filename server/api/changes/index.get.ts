import { prisma } from '../../plugins/prisma'
import { requireAuth } from '../../utils/auth'
import type { ApprovalStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)

  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}

  if (query.status) {
    where.status = query.status as ApprovalStatus
  }
  if (query.alertId) {
    where.alertId = parseInt(query.alertId as string)
  }
  if (query.keyword) {
    where.OR = [
      { title: { contains: query.keyword as string } },
      { changeNo: { contains: query.keyword as string } }
    ]
  }
  if (user.role === 'STORE_OPERATOR') {
    where.submitterId = user.id
  }

  const [changes, total] = await Promise.all([
    prisma.changeRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        alert: { select: { id: true, alertNo: true, title: true, level: true, status: true } },
        submitter: { select: { id: true, realName: true } },
        approver: { select: { id: true, realName: true } }
      }
    }),
    prisma.changeRequest.count({ where })
  ])

  return {
    data: changes,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
})
