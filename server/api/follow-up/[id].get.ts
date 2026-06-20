import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse } from '~/server/utils/response'
import { getDataSource } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const id = parseInt(getRouterParam(event, 'id') || '0')

  const task = await prisma.followUpTask.findUnique({
    where: { id },
    include: {
      patient: true,
      course: true,
      creator: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      followUpRecords: {
        orderBy: { recordDate: 'desc' },
        include: {
          operator: { select: { id: true, name: true } }
        }
      },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        include: {
          operator: { select: { id: true, name: true } }
        }
      }
    }
  })

  if (!task) {
    throw createError({
      statusCode: 404,
      statusMessage: '随访任务不存在'
    })
  }

  const dataSources = await getDataSource('FOLLOW_UP_TASK', id)

  return successResponse({
    ...task,
    dataSources
  }, '获取成功')
})
