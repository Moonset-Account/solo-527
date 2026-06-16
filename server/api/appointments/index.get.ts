import { prisma } from '~/server/utils/prisma'
import { handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 20
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {}
    if (query.status) where.status = query.status
    if (query.assigneeId) where.assigneeId = query.assigneeId
    if (query.dateFrom || query.dateTo) {
      where.scheduledAt = {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom as string) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo as string) } : {}),
      }
    }

    const [items, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          vehicle: true,
          assignee: true,
        },
        skip,
        take: pageSize,
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.appointment.count({ where }),
    ])

    return { success: true, data: { items, total, page, pageSize } }
  } catch (error) {
    handlePrismaError(error, '查询预约列表')
  }
})
