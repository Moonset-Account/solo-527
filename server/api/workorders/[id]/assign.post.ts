import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN'])

  const id = parseInt(event.context.params!.id)
  const body = await readBody(event)
  const { assigneeId, remark } = body

  if (!assigneeId) {
    return errorResponse('请选择处理人')
  }

  const workOrder = await prisma.workOrder.findUnique({ where: { id } })
  if (!workOrder) {
    return errorResponse('工单不存在', 404)
  }

  const assignee = await prisma.user.findUnique({ where: { id: assigneeId } })
  if (!assignee || assignee.role !== 'ENGINEER') {
    return errorResponse('处理人必须是工程师')
  }

  const assignment = await prisma.workOrderAssignment.create({
    data: {
      workOrderId: id,
      assigneeId,
      remark,
      status: 'PENDING'
    },
    include: {
      assignee: { select: { id: true, name: true, phone: true } }
    }
  })

  await prisma.workOrder.update({
    where: { id },
    data: {
      status: 'ASSIGNED',
      actualStart: new Date()
    }
  })

  await prisma.workOrderProgress.create({
    data: {
      workOrderId: id,
      status: '已派工',
      description: `已派工给${assignee.name}`,
      operatorId: user.id,
      operatorName: user.name,
      progressPercent: 10
    }
  })

  return successResponse(assignment, '派工成功')
})
