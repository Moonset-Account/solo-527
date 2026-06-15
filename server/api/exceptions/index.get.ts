import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN', 'ENGINEER'])

  const query = getQuery(event)
  const status = query.status as string
  const type = query.type as string
  const handlerId = query.handlerId as string
  const startDate = query.startDate as string
  const endDate = query.endDate as string
  const keyword = query.keyword as string
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20

  const where: any = {}

  if (status && status !== 'all') {
    where.status = status
  }

  if (type && type !== 'all') {
    where.type = type
  }

  if (handlerId && handlerId !== 'all') {
    where.handlerId = parseInt(handlerId)
  }

  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
  }

  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    where.createdAt = { ...where.createdAt, lte: end }
  }

  if (keyword) {
    where.OR = [
      { exceptionNo: { contains: keyword } },
      { title: { contains: keyword } },
      { relatedNo: { contains: keyword } }
    ]
  }

  const [total, exceptions] = await Promise.all([
    prisma.auditException.count({ where }),
    prisma.auditException.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
        handler: { select: { id: true, name: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ])

  return successResponse({
    list: exceptions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  })
})
