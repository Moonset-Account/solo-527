import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN', 'ENGINEER'])

  const id = parseInt(event.context.params!.id)
  const body = await readBody(event)
  const { content } = body

  if (!content || !content.trim()) {
    return errorResponse('备注内容不能为空')
  }

  const exception = await prisma.auditException.findUnique({
    where: { id }
  })

  if (!exception) {
    return errorResponse('异常不存在', 404)
  }

  if (exception.status === 'CLOSED') {
    return errorResponse('已关闭的异常无法添加备注')
  }

  const remarks = JSON.parse(exception.remarks || '[]')
  remarks.push({
    id: Date.now(),
    operatorId: user.id,
    operatorName: user.name,
    content: content.trim(),
    timestamp: new Date().toISOString()
  })

  const history = JSON.parse(exception.history || '[]')
  history.push({
    action: 'REMARK',
    operatorId: user.id,
    operatorName: user.name,
    content: content.trim(),
    timestamp: new Date().toISOString()
  })

  const updated = await prisma.auditException.update({
    where: { id },
    data: {
      remarks: JSON.stringify(remarks),
      history: JSON.stringify(history)
    }
  })

  return successResponse(updated)
})
