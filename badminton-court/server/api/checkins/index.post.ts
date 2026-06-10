import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse, generateOrderNo } from '../../utils/helpers'
import { z } from 'zod'

const checkinSchema = z.union([
  z.object({
    type: z.literal('CODE'),
    code: z.string().min(6)
  }),
  z.object({
    type: z.literal('BOOKING'),
    bookingId: z.number().int().positive()
  }),
  z.object({
    type: z.literal('MANUAL'),
    userId: z.number().int().positive(),
    courtId: z.number().int().positive().optional(),
    remark: z.string().optional()
  })
])

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAuth(event)
    const body = await readBody(event)
    const data = checkinSchema.parse(body)

    let bookingId: number | undefined
    let userId: number
    let courtId: number | undefined
    let tournamentId: number | undefined
    let tournamentRegId: number | undefined

    if (data.type === 'CODE') {
      const booking = await prisma.booking.findFirst({
        where: {
          OR: [
            { checkInCode: data.code },
            { orderNo: data.code }
          ]
        }
      })
      if (!booking) return errorResponse('无效的核销码', 404)
      if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
        return errorResponse('预约已取消/退款', 400)
      }
      if (booking.status === 'COMPLETED' || booking.status === 'ABNORMAL') {
        return errorResponse('预约已结束', 400)
      }
      bookingId = booking.id
      userId = booking.customerId
      courtId = booking.courtId
      tournamentId = booking.tournamentId ?? undefined
    } else if (data.type === 'BOOKING') {
      const booking = await prisma.booking.findUnique({ where: { id: data.bookingId } })
      if (!booking) return errorResponse('预约不存在', 404)
      bookingId = booking.id
      userId = booking.customerId
      courtId = booking.courtId
      tournamentId = booking.tournamentId ?? undefined
    } else {
      userId = data.userId
      courtId = data.courtId
    }

    const existing = await prisma.checkInRecord.findFirst({
      where: {
        bookingId,
        userId,
        status: { in: ['CHECKED_IN', 'CHECKED_OUT'] }
      }
    })
    if (existing) return errorResponse('已签到，请勿重复操作', 409)

    const checkIn = await prisma.checkInRecord.create({
      data: {
        checkInNo: generateOrderNo('CI'),
        bookingId,
        tournamentRegId,
        userId,
        courtId,
        tournamentId,
        status: 'CHECKED_IN',
        checkInTime: new Date(),
        operatorId: auth.id,
        method: data.type,
        remark: data.type === 'MANUAL' ? (data as any).remark || '人工签到' : undefined
      },
      include: {
        user: { select: { id: true, realName: true, phone: true } },
        booking: { select: { id: true, orderNo: true, startTime: true, endTime: true } },
        court: { select: { id: true, courtNumber: true, name: true } }
      }
    })

    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CHECKED_IN' }
      })
      await prisma.bookingLog.create({
        data: {
          bookingId,
          operatorId: auth.id,
          action: 'CHECKIN',
          oldStatus: undefined,
          newStatus: 'CHECKED_IN',
          remark: '签到核销'
        }
      })
    }

    return successResponse(checkIn, '签到成功')
  } catch (e: any) {
    if (e instanceof z.ZodError) return errorResponse(e.errors[0].message, 400)
    return errorResponse(e.message || '签到失败', 500)
  }
})
