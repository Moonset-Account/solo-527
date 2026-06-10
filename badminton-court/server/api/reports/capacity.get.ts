import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse, paginate } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 20
    const coachId = query.coachId ? Number(query.coachId) : undefined
    const weekStart = query.weekStart as string
    const myReport = query.my === 'true'

    const auth = (event.context as any).auth
    const where: any = {}

    if (myReport) {
      const coach = await prisma.coachProfile.findUnique({ where: { userId: auth.id } })
      if (coach) where.coachId = coach.id
      else return successResponse({ list: [], total: 0, page, pageSize, totalPages: 0 })
    } else if (coachId) {
      where.coachId = coachId
    }
    if (weekStart) where.weekStart = new Date(weekStart)

    const result = await paginate(
      prisma.coachCapacityReport, page, pageSize, where,
      {
        coach: {
          include: {
            user: { select: { id: true, realName: true, phone: true } }
          }
        }
      },
      { reportDate: 'desc' }
    )

    return successResponse(result)
  } catch (e: any) {
    return errorResponse(e.message || '获取产能报表失败', 500)
  }
})
