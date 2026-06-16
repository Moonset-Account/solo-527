import { prisma } from '~/server/utils/prisma'
import { createApiError, handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      return createApiError({ statusCode: 400, statusMessage: '缺少任务ID' })
    }

    const body = await readBody(event)
    const { action, notes, linkedTemplateId, linkedPaymentId, linkedVehicleId, operatorId } = body

    if (!action || !operatorId) {
      return createApiError({ statusCode: 400, statusMessage: '缺少必填字段' })
    }

    const existing = await prisma.task.findUnique({
      where: { id },
      include: { appointment: true },
    })
    if (!existing) {
      return createApiError({ statusCode: 404, statusMessage: '任务不存在' })
    }

    const statusMap: Record<string, string> = {
      '开始处理': 'IN_PROGRESS',
      '完成': 'COMPLETED',
      '暂停': 'PAUSED',
      '试驾改期': 'PENDING',
    }

    const processLog = await prisma.$transaction(async (tx) => {
      const log = await tx.taskProcessLog.create({
        data: {
          taskId: id,
          action,
          notes,
          operatorId,
          linkedTemplateId,
          linkedPaymentId,
          linkedVehicleId,
        },
      })

      const newStatus = statusMap[action]
      if (newStatus) {
        await tx.task.update({
          where: { id },
          data: { status: newStatus },
        })
      }

      if (action === '试驾改期' && existing.storeId) {
        const now = new Date()
        const periodDate = new Date(now.getFullYear(), now.getMonth(), 1)
        const partCode = `RESCHEDULE-${id.substring(0, 8)}`

        const existingPart = await tx.partsTurnover.findFirst({
          where: {
            storeId: existing.storeId,
            partCode,
            period: periodDate,
          },
        })

        if (existingPart) {
          await tx.partsTurnover.update({
            where: { id: existingPart.id },
            data: { usedQuantity: { increment: 1 } },
          })
        } else {
          await tx.partsTurnover.create({
            data: {
              partName: '试驾改期',
              partCode,
              stockQuantity: 0,
              usedQuantity: 1,
              turnoverRate: 0,
              storeId: existing.storeId,
              period: periodDate,
            },
          })
        }
      }

      return log
    })

    return { success: true, data: processLog }
  } catch (error) {
    handlePrismaError(error, '处理任务')
  }
})
