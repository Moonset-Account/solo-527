import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!id) return errorResponse('参数错误', 400)

    const court = await prisma.court.findUnique({
      where: { id },
      include: { prices: { orderBy: [{ weekDay: 'asc' }, { startTime: 'asc' }] } }
    })
    if (!court) return errorResponse('场地不存在', 404)

    return successResponse(court)
  } catch (e: any) {
    return errorResponse(e.message || '查询失败', 500)
  }
})
