import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  const id = parseInt(event.context.params!.id)

  const repair = await prisma.engineeringRepair.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true } },
      handler: { select: { id: true, name: true, phone: true } },
      satisfactionSurvey: true
    }
  })

  if (!repair) {
    return errorResponse('工程报修不存在', 404)
  }

  return successResponse(repair)
})
