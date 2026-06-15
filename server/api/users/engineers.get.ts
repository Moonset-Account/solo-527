import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN'])

  const engineers = await prisma.user.findMany({
    where: { role: 'ENGINEER' },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true
    }
  })

  return successResponse(engineers)
})
