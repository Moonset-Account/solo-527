import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN'])

  const id = parseInt(event.context.params!.id)
  const body = await readBody(event)
  const { handlerId, remark } = body

  if (!handlerId) {
    return errorResponse('请选择处理人')
  }

  const exception = await prisma.auditException.findUnique({
    where: { id }
  })

  if (!exception) {
    return errorResponse('异常不存在', 404)
  }

  if (exception.status === 'CLOSED') {
    return errorResponse('已关闭的异常无法分配')
  }

  const handler = await prisma.user.findUnique({
    where: { id: handlerId }
  })

  if (!handler) {
    return errorResponse('处理人不存在')
  }

  const history = JSON.parse(exception.history || '[]')
  history.push({
    action: 'ASSIGN',
    operatorId: user.id,
    operatorName: user.name,
    handlerId,
    handlerName: handler.name,
    remark,
    timestamp: new Date().toISOString()
  })

  const updated = await prisma.auditException.update({
    where: { id },
    data: {
      handlerId,
      status: 'ASSIGNED',
      history: JSON.stringify(history)
    }
  })

  return successResponse(updated)
})
