import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  const id = parseInt(event.context.params!.id)

  const visitor = await prisma.visitorAppointment.findUnique({
    where: { id },
    include: {
      tenant: true,
      creator: { select: { id: true, name: true } },
      handler: { select: { id: true, name: true } },
      satisfactionSurvey: true
    }
  })

  if (!visitor) {
    return errorResponse('访客预约不存在', 404)
  }

  if (user.role === 'TENANT' && visitor.tenantId !== user.tenantId) {
    return errorResponse('无权查看此预约', 403)
  }

  const exceptions = await prisma.auditException.findMany({
    where: {
      sourceType: 'VISITOR',
      sourceId: id
    },
    orderBy: { processOrder: 'asc' }
  })

  return successResponse({
    ...visitor,
    exceptions
  })
})
