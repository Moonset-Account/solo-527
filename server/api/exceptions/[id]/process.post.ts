import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN', 'ENGINEER'])

  const id = parseInt(event.context.params!.id)
  const body = await readBody(event)
  const { stepIndex, stepStatus, remark } = body

  const exception = await prisma.auditException.findUnique({
    where: { id }
  })

  if (!exception) {
    return errorResponse('异常不存在', 404)
  }

  if (exception.status === 'CLOSED') {
    return errorResponse('已关闭的异常无法处理')
  }

  if (exception.handlerId && exception.handlerId !== user.id && !['OPERATOR', 'ADMIN'].includes(user.role)) {
    return errorResponse('只有处理人或管理员可以更新步骤状态')
  }

  const processOrder = JSON.parse(exception.processOrder || '[]')
  if (stepIndex !== undefined && stepIndex >= 0 && stepIndex < processOrder.length) {
    processOrder[stepIndex].status = stepStatus || 'IN_PROGRESS'
  }

  const history = JSON.parse(exception.history || '[]')
  history.push({
    action: 'PROCESS',
    operatorId: user.id,
    operatorName: user.name,
    stepIndex,
    stepStatus,
    remark,
    timestamp: new Date().toISOString()
  })

  const allDone = processOrder.every((step: any) => step.status === 'DONE')
  const newStatus = allDone ? 'RESOLVED' : 'PROCESSING'

  const updated = await prisma.auditException.update({
    where: { id },
    data: {
      status: newStatus,
      processOrder: JSON.stringify(processOrder),
      history: JSON.stringify(history),
      isHandled: allDone
    }
  })

  return successResponse(updated)
})
