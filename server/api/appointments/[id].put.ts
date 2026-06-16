import { prisma } from '~/server/utils/prisma'
import { createApiError, handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      return createApiError({ statusCode: 400, statusMessage: '缺少预约ID' })
    }

    const body = await readBody(event)
    const { status, scheduledAt, assigneeId, notes } = body

    const existing = await prisma.appointment.findUnique({ where: { id } })
    if (!existing) {
      return createApiError({ statusCode: 404, statusMessage: '预约不存在' })
    }

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt)
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId
    if (notes !== undefined) updateData.notes = notes

    if (status === 'COMPLETED' && existing.serviceType === 'TEST_DRIVE') {
      await prisma.partsTurnover.updateMany({
        where: { storeId: existing.storeId },
        data: { usedQuantity: { increment: 1 } },
      })
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: true,
        assignee: true,
        payment: {
          include: { items: true },
        },
      },
    })

    return { success: true, data: appointment }
  } catch (error) {
    handlePrismaError(error, '更新预约')
  }
})
