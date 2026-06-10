import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse, paginate, isTimeOverlap, parseTimeToMinutes, dateToStr, getWeekDay, isHoliday } from '../../utils/helpers'
import type { BookingStatus, AbnormalReason } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 20
    const date = query.date as string
    const status = query.status as BookingStatus | undefined
    const courtId = query.courtId ? Number(query.courtId) : undefined
    const customerId = query.customerId ? Number(query.customerId) : undefined
    const keyword = query.keyword as string || ''
    const myBookings = query.my === 'true'

    const auth = (event.context as any).auth
    const where: any = {}

    if (myBookings) {
      where.customerId = auth.id
    } else if (customerId) {
      where.customerId = customerId
    }

    if (date) {
      const d = new Date(date)
      where.bookingDate = {
        gte: new Date(dateToStr(d)),
        lt: new Date(dateToStr(new Date(d.getTime() + 86400000)))
      }
    }
    if (status) where.status = status
    if (courtId) where.courtId = courtId
    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { customer: { realName: { contains: keyword } } },
        { customer: { phone: { contains: keyword } } },
        { checkInCode: { contains: keyword } }
      ]
    }

    const result = await paginate(
      prisma.booking, page, pageSize, where,
      {
        customer: { select: { id: true, realName: true, phone: true, username: true } },
        court: { select: { id: true, courtNumber: true, name: true, location: true } },
        staff: { select: { id: true, realName: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        coachAssignments: { include: { coach: { include: { user: true } } } },
        checkIns: { orderBy: { createdAt: 'desc' }, take: 1 },
        tournament: { select: { id: true, name: true } },
        logs: { orderBy: { createdAt: 'desc' }, take: 3 }
      },
      [{ bookingDate: 'desc' }, { createdAt: 'desc' }]
    )

    return successResponse(result)
  } catch (e: any) {
    return errorResponse(e.message || '获取预约列表失败', 500)
  }
})
