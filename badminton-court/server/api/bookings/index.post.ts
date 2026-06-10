import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse, generateOrderNo, calculateDuration, isTimeOverlap, dateToStr, getWeekDay, isHoliday, generateCheckInCode } from '../../utils/helpers'
import { z } from 'zod'
import type { BookingStatus } from '@prisma/client'

const createSchema = z.object({
  courtId: z.number().int().positive(),
  bookingDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  customerId: z.number().int().optional(),
  peopleCount: z.number().int().min(1).optional().default(2),
  needCoach: z.boolean().optional().default(false),
  coachId: z.number().int().optional(),
  remark: z.string().optional(),
  source: z.string().optional().default('SYSTEM'),
  tournamentId: z.number().int().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAuth(event)
    const body = await readBody(event)
    const data = createSchema.parse(body)

    const court = await prisma.court.findUnique({ where: { id: data.courtId } })
    if (!court) return errorResponse('场地不存在', 404)
    if (court.status === 'MAINTENANCE' || court.status === 'CLOSED') {
      return errorResponse('场地当前不可预约', 400)
    }

    const bookingDate = new Date(data.bookingDate)
    const today = new Date(dateToStr(new Date()))
    const maxDays = 7
    if (bookingDate < today) return errorResponse('不能预约过去的日期', 400)
    if (bookingDate > new Date(today.getTime() + maxDays * 86400000)) {
      return errorResponse(`最多只能提前${maxDays}天预约`, 400)
    }

    const duration = calculateDuration(data.startTime, data.endTime)
    if (duration < 30) return errorResponse('预约时长至少30分钟', 400)

    const dayStart = new Date(dateToStr(bookingDate))
    const dayEnd = new Date(dayStart.getTime() + 86400000)
    const existingBookings = await prisma.booking.findMany({
      where: {
        courtId: data.courtId,
        bookingDate: { gte: dayStart, lt: dayEnd },
        status: { in: ['PENDING', 'CONFIRMED', 'PAID', 'CHECKED_IN', 'IN_USE'] as BookingStatus[] }
      }
    })
    for (const b of existingBookings) {
      if (isTimeOverlap(data.startTime, data.endTime, b.startTime, b.endTime)) {
        return errorResponse(`该时段已被预约 (${b.startTime}-${b.endTime})`, 409)
      }
    }

    const weekDay = getWeekDay(bookingDate)
    const isHol = isHoliday(bookingDate)
    const priceRecord = await prisma.courtPrice.findFirst({
      where: {
        courtId: data.courtId,
        weekDay,
        isHoliday: isHol,
        startTime: { lte: data.startTime },
        endTime: { gt: data.startTime }
      }
    })

    const pricePerHour = priceRecord ? Number(priceRecord.price) : 80
    const hours = duration / 60
    const originalPrice = Math.round(pricePerHour * hours * 100) / 100

    let actualAmount = originalPrice
    let coachCost = 0

    if (data.needCoach && data.coachId) {
      const coach = await prisma.coachProfile.findUnique({ where: { id: data.coachId } })
      if (coach) coachCost = Math.round(Number(coach.hourlyRate) * hours * 100) / 100
      actualAmount += coachCost
    }

    const customerId = data.customerId || (auth.role === 'CUSTOMER' ? auth.id : undefined)
    if (!customerId) return errorResponse('请指定客户', 400)

    const orderNo = generateOrderNo('BK')
    const checkInCode = generateCheckInCode()

    const booking = await prisma.booking.create({
      data: {
        orderNo,
        customerId,
        staffId: auth.role !== 'CUSTOMER' ? auth.id : null,
        courtId: data.courtId,
        bookingDate: bookingDate,
        startTime: data.startTime,
        endTime: data.endTime,
        duration,
        originalPrice,
        actualAmount,
        paidAmount: 0,
        status: 'PENDING',
        isPeakHour: (parseInt(data.startTime) >= 18),
        isMember: false,
        source: data.source,
        remark: data.remark || null,
        checkInCode,
        peopleCount: data.peopleCount,
        needCoach: data.needCoach,
        tournamentId: data.tournamentId || null
      }
    })

    if (data.needCoach && data.coachId && coachCost > 0) {
      await prisma.coachAssignment.create({
        data: {
          bookingId: booking.id,
          coachId: data.coachId,
          startTime: data.startTime,
          endTime: data.endTime,
          hourlyRate: (await prisma.coachProfile.findUnique({ where: { id: data.coachId } }))?.hourlyRate || 0,
          totalCost: coachCost
        }
      })
    }

    await prisma.bookingLog.create({
      data: { bookingId: booking.id, operatorId: auth.id, action: 'CREATE', remark: '创建预约' }
    })

    const fullBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        customer: { select: { id: true, realName: true, phone: true } },
        court: true,
        coachAssignments: { include: { coach: { include: { user: true } } } }
      }
    })

    return successResponse(fullBooking, '预约成功')
  } catch (e: any) {
    if (e instanceof z.ZodError) return errorResponse(e.errors[0].message, 400)
    return errorResponse(e.message || '预约失败', 500)
  }
})
