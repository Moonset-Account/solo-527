import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  const id = parseInt(event.context.params!.id)
  const body = await readBody(event)
  const { status, description, progressPercent, images } = body

  if (!status || !description) {
    return errorResponse('请填写状态和描述')
  }

  const workOrder = await prisma.workOrder.findUnique({ where: { id } })
  if (!workOrder) {
    return errorResponse('工单不存在', 404)
  }

  const progress = await prisma.workOrderProgress.create({
    data: {
      workOrderId: id,
      status,
      description,
      operatorId: user.id,
      operatorName: user.name,
      progressPercent: progressPercent || 0,
      images: images ? JSON.stringify(images) : null
    }
  })

  if (progressPercent && progressPercent >= 100) {
    await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualEnd: new Date()
      }
    })
  }

  return successResponse(progress, '进度更新成功')
})
