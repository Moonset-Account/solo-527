import { prisma } from '~/server/utils/prisma'
import { createApiError, handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      return createApiError({ statusCode: 400, statusMessage: '缺少任务ID' })
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: true,
        vehicle: true,
        appointment: true,
        processLogs: {
          include: {
            linkedTemplate: true,
            linkedPayment: true,
            linkedVehicle: true,
            operator: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!task) {
      return createApiError({ statusCode: 404, statusMessage: '任务不存在' })
    }

    return { success: true, data: task }
  } catch (error) {
    handlePrismaError(error, '查询任务详情')
  }
})
