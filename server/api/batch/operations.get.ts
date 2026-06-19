import { prisma } from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager', 'customer_service'])
  const query = getQuery(event)

  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 20

  const [operations, total] = await Promise.all([
    prisma.batchOperation.findMany({
      include: {
        operator: { select: { name: true } },
        failedRecords: {
          where: { resolved: false },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.batchOperation.count(),
  ])

  return {
    data: operations.map(op => ({
      ...op,
      operatorName: op.operator.name,
      targetIds: op.targetIds as string[],
      failedRecords: op.failedRecords,
    })),
    total,
    page,
    pageSize,
  }
})
