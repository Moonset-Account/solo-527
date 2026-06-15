import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN'])

  const id = parseInt(event.context.params!.id)
  const body = await readBody(event)
  const { remark } = body

  const exception = await prisma.auditException.findUnique({
    where: { id }
  })

  if (!exception) {
    return errorResponse('异常不存在', 404)
  }

  if (exception.status === 'CLOSED') {
    return errorResponse('该异常已关闭')
  }

  const processOrder = JSON.parse(exception.processOrder || '[]')
  const allDone = processOrder.every((step: any) => step.status === 'DONE')

  if (!allDone && !['OPERATOR', 'ADMIN'].includes(user.role)) {
    return errorResponse('所有处理步骤完成后才能关闭')
  }

  const history = JSON.parse(exception.history || '[]')
  history.push({
    action: 'CLOSE',
    operatorId: user.id,
    operatorName: user.name,
    remark,
    timestamp: new Date().toISOString()
  })

  const updated = await prisma.auditException.update({
    where: { id },
    data: {
      status: 'CLOSED',
      isHandled: true,
      handledAt: new Date(),
      history: JSON.stringify(history)
    }
  })

  return successResponse(updated)
})
