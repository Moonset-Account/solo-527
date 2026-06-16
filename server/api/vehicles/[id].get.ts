import { prisma } from '~/server/utils/prisma'
import { createApiError, handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      return createApiError({ statusCode: 400, statusMessage: '缺少车辆ID' })
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { scheduledAt: 'desc' },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!vehicle) {
      return createApiError({ statusCode: 404, statusMessage: '车辆不存在' })
    }

    return { success: true, data: vehicle }
  } catch (error) {
    handlePrismaError(error, '查询车辆详情')
  }
})
