import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const taskId = parseInt(getRouterParam(event, 'id') || '0')
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20

  const [records, total] = await Promise.all([
    prisma.followUpRecord.findMany({
      where: { taskId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { recordDate: 'desc' },
      include: {
        operator: {
          select: { id: true, name: true }
        }
      }
    }),
    prisma.followUpRecord.count({ where: { taskId } })
  ])

  return successResponse(records, '获取随访历史成功', total)
})
