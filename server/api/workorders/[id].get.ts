import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  const id = parseInt(event.context.params!.id)

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, phone: true } },
      tenant: true,
      assignments: {
        include: {
          assignee: { select: { id: true, name: true, phone: true } }
        },
        orderBy: { createdAt: 'desc' }
      },
      materials: {
        orderBy: { createdAt: 'desc' }
      },
      progressLogs: {
        orderBy: { createdAt: 'asc' }
      },
      review: true,
      cost: true,
      satisfactionSurvey: true
    }
  })

  if (!workOrder) {
    return errorResponse('工单不存在', 404)
  }

  if (user.role === 'TENANT' && workOrder.tenantId !== user.tenantId) {
    return errorResponse('无权查看此工单', 403)
  }

  return successResponse(workOrder)
})
