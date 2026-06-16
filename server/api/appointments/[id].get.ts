import { prisma } from '~/server/utils/prisma'
import { createApiError, handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      return createApiError({ statusCode: 400, statusMessage: '缺少预约ID' })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        vehicle: true,
        assignee: true,
        payment: {
          include: { items: true },
        },
      },
    })

    if (!appointment) {
      return createApiError({ statusCode: 404, statusMessage: '预约不存在' })
    }

    return { success: true, data: appointment }
  } catch (error) {
    handlePrismaError(error, '查询预约详情')
  }
})
