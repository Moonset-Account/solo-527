import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN'])

  const id = parseInt(event.context.params!.id)

  const workOrder = await prisma.workOrder.findUnique({ where: { id } })
  if (!workOrder) {
    return errorResponse('工单不存在', 404)
  }

  await prisma.workOrder.update({
    where: { id },
    data: { status: 'CLOSED' }
  })

  await prisma.workOrderProgress.create({
    data: {
      workOrderId: id,
      status: '已结案',
      description: '工单已结案归档',
      operatorId: user.id,
      operatorName: user.name,
      progressPercent: 100
    }
  })

  return successResponse(null, '工单已结案')
})
