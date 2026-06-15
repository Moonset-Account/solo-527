import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { paginatedResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const status = query.status as string
  const keyword = query.keyword as string
  const tenantId = query.tenantId ? parseInt(query.tenantId as string) : undefined
  const startDate = query.startDate as string
  const endDate = query.endDate as string

  const where: any = {}

  if (user.role === 'TENANT') {
    where.tenantId = user.tenantId
  }

  if (status && status !== 'all') {
    where.status = status
  }

  if (tenantId) {
    where.tenantId = tenantId
  }

  if (keyword) {
    where.OR = [
      { visitNo: { contains: keyword } },
      { visitorName: { contains: keyword } },
      { visitorPhone: { contains: keyword } },
      { visitorCompany: { contains: keyword } }
    ]
  }

  if (startDate) {
    where.visitDate = { ...where.visitDate, gte: new Date(startDate) }
  }

  if (endDate) {
    where.visitDate = { ...where.visitDate, lte: new Date(endDate) }
  }

  const [total, list] = await Promise.all([
    prisma.visitorAppointment.count({ where }),
    prisma.visitorAppointment.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        handler: { select: { id: true, name: true } }
      },
      orderBy: { visitDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ])

  return paginatedResponse(list, total, page, pageSize)
})
