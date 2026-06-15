import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { paginatedResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const status = query.status as string
  const priority = query.priority as string
  const keyword = query.keyword as string
  const startDate = query.startDate as string
  const endDate = query.endDate as string

  const where: any = {}

  if (status && status !== 'all') {
    where.status = status
  }

  if (priority && priority !== 'all') {
    where.priority = priority
  }

  if (keyword) {
    where.OR = [
      { repairNo: { contains: keyword } },
      { title: { contains: keyword } },
      { equipmentName: { contains: keyword } }
    ]
  }

  if (startDate) {
    where.createdAt = {
      gte: new Date(startDate)
    }
  }

  if (endDate) {
    where.createdAt = {
      ...where.createdAt,
      lte: new Date(endDate + 'T23:59:59.999Z')
    }
  }

  const [total, list] = await Promise.all([
    prisma.engineeringRepair.count({ where }),
    prisma.engineeringRepair.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
        handler: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ])

  return paginatedResponse(list, total, page, pageSize)
})
