import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN'])

  const id = parseInt(event.context.params!.id)

  const visitor = await prisma.visitorAppointment.findUnique({ where: { id } })
  if (!visitor) {
    return errorResponse('访客预约不存在', 404)
  }

  if (visitor.status !== 'PENDING') {
    return errorResponse('此预约状态不允许审核')
  }

  const updated = await prisma.visitorAppointment.update({
    where: { id },
    data: {
      status: 'APPROVED',
      handlerId: user.id
    }
  })

  return successResponse(updated, '审核通过')
})
