import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN'])

  const id = parseInt(event.context.params!.id)
  const body = await readBody(event)
  const { result, content, suggestion } = body

  if (!result || !content) {
    return errorResponse('请填写回访结果和内容')
  }

  const workOrder = await prisma.workOrder.findUnique({ where: { id } })
  if (!workOrder) {
    return errorResponse('工单不存在', 404)
  }

  const review = await prisma.workOrderReview.upsert({
    where: { workOrderId: id },
    update: {
      result,
      content,
      suggestion,
      reviewDate: new Date()
    },
    create: {
      workOrderId: id,
      reviewerId: user.id,
      result,
      content,
      suggestion
    }
  })

  await prisma.workOrder.update({
    where: { id },
    data: { status: 'REVIEWED' }
  })

  return successResponse(review, '回访评价成功')
})
