import { prisma } from '~/server/utils/prisma'
import { createApiError, handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { customerName, customerPhone, vehicleId, serviceType, scheduledAt, assigneeId, storeId, notes } = body

    if (!customerName || !vehicleId || !serviceType || !scheduledAt || !assigneeId || !storeId) {
      return createApiError({
        statusCode: 400,
        statusMessage: '缺少必填字段',
      })
    }

    const validServiceTypes = ['WASH', 'MAINTENANCE', 'TEST_DRIVE']
    if (!validServiceTypes.includes(serviceType)) {
      return createApiError({
        statusCode: 400,
        statusMessage: '无效的服务类型',
      })
    }

    const appointment = await prisma.appointment.create({
      data: {
        customerName,
        customerPhone,
        vehicleId,
        serviceType,
        scheduledAt: new Date(scheduledAt),
        assigneeId,
        storeId,
        notes,
      },
      include: {
        vehicle: true,
        assignee: true,
      },
    })

    return { success: true, data: appointment }
  } catch (error) {
    handlePrismaError(error, '创建预约')
  }
})
