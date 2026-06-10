import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!id) return errorResponse('参数错误', 400)

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, realName: true, phone: true, username: true, balance: true, email: true } },
        court: { include: { prices: { orderBy: [{ weekDay: 'asc' }, { startTime: 'asc' }] } } },
        staff: { select: { id: true, realName: true, phone: true } },
        payment: true,
        coachAssignments: { include: { coach: { include: { user: true } } } },
        checkIns: { orderBy: { createdAt: 'desc' }, include: { operator: { select: { id: true, realName: true } } } },
        tournament: { select: { id: true, name: true, startDate: true, endDate: true } },
        logs: { orderBy: { createdAt: 'desc' }, include: { operator: { select: { id: true, realName: true } } } },
        reminders: { orderBy: { createdAt: 'desc' } }
      }
    })
    if (!booking) return errorResponse('预约不存在', 404)

    return successResponse(booking)
  } catch (e: any) {
    return errorResponse(e.message || '查询失败', 500)
  }
})
