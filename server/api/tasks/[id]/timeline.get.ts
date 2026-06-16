import { prisma } from '~/server/utils/prisma'
import { createApiError, handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      return createApiError({ statusCode: 400, statusMessage: '缺少任务ID' })
    }

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      return createApiError({ statusCode: 404, statusMessage: '任务不存在' })
    }

    const processLogs = await prisma.taskProcessLog.findMany({
      where: { taskId: id },
      include: {
        linkedTemplate: true,
        linkedPayment: true,
        linkedVehicle: true,
        operator: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: processLogs }
  } catch (error) {
    handlePrismaError(error, '查询任务时间线')
  }
})
