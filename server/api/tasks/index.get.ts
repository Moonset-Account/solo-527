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
      where.createdAt = {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom as string) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo as string) } : {}),
      }
    }

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: true,
          vehicle: true,
          appointment: true,
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count({ where }),
    ])

    return { success: true, data: { items, total, page, pageSize } }
  } catch (error) {
    handlePrismaError(error, '查询任务列表')
  }
})
