import { prisma } from '~/server/utils/prisma'
import { handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)

    const where: Record<string, unknown> = {}
    if (query.storeId) where.storeId = query.storeId
    if (query.dateFrom || query.dateTo) {
      where.period = {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom as string) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo as string) } : {}),
      }
    }

    const items = await prisma.partsTurnover.findMany({
      where,
      include: {
        store: {
          select: { id: true, name: true },
        },
      },
      orderBy: { period: 'desc' },
    })

    return { success: true, data: items }
  } catch (error) {
    handlePrismaError(error, '查询配件周转')
  }
})
