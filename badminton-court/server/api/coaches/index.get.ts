import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const coaches = await prisma.coachProfile.findMany({
      include: { user: { select: { id: true, realName: true, username: true, phone: true } } },
      where: { isActive: true },
      orderBy: { id: 'asc' }
    })
    return successResponse(coaches)
  } catch (e: any) {
    return successResponse([])
  }
})
