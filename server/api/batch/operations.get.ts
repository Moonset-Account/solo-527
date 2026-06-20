import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['ADMIN', 'OPERATOR'])

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const operationType = query.operationType as string
  const status = query.status as string

  const where: any = {}
  if (operationType) where.operationType = operationType
  if (status) where.status = status

  const [operations, total] = await Promise.all([
    prisma.batchOperation.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        operator: {
          select: { id: true, name: true }
        }
      }
    }),
    prisma.batchOperation.count({ where })
  ])

  return successResponse(operations, '获取成功', total)
})
