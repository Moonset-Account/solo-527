import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN', 'ENGINEER'])

  const id = parseInt(event.context.params!.id)

  const exception = await prisma.auditException.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, role: true } },
      handler: { select: { id: true, name: true, role: true, phone: true } }
    }
  })

  if (!exception) {
    return errorResponse('异常不存在', 404)
  }

  return successResponse(exception)
})
