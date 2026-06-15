import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { paginatedResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const status = query.status as string
  const type = query.type as string
  const priority = query.priority as string
  const keyword = query.keyword as string
  const tenantId = query.tenantId ? parseInt(query.tenantId as string) : undefined
  const startDate = query.startDate as string
  const endDate = query.endDate as string
  const mine = query.mine === 'true'

  const where: any = {}

  if (user.role === 'TENANT' || mine) {
    where.tenantId = user.tenantId
  }

  if (user.role === 'ENGINEER') {
    where.assignments = {
      some: {
        assigneeId: user.id
      }
    }
  }

  if (status && status !== 'all') {
    if (status.includes(',')) {
      where.status = { in: status.split(',') }
    } else {
      where.status = status
    }
  }

  if (type && type !== 'all') {
    where.type = type
  }

  if (priority && priority !== 'all') {
    where.priority = priority
  }

  if (tenantId) {
    where.tenantId = tenantId
  }

  if (keyword) {
    where.OR = [
      { orderNo: { contains: keyword } },
      { title: { contains: keyword } },
      { description: { contains: keyword } }
    ]
  }

  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
  }

  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(endDate) }
  }

  const [total, list] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
        assignments: {
          include: {
            assignee: { select: { id: true, name: true } }
          }
        },
        progressLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ])

  return paginatedResponse(list, total, page, pageSize)
})
