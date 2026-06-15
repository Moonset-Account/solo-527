import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN'])

  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      contactName: true,
      contactPhone: true,
      address: true,
      floor: true,
      roomNumber: true
    },
    orderBy: { name: 'asc' }
  })

  return successResponse(tenants)
})
