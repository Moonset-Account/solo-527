import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse, generateOrderNo } from '../../utils/helpers'
import { z } from 'zod'
import type { BookingStatus, PaymentMethod, PaymentStatus, AbnormalReason } from '@prisma/client'

const statusMap: Record<string, BookingStatus[]> = {
  confirm: ['PENDING'],
  cancel: ['PENDING', 'CONFIRMED'],
  pay: ['PENDING', 'CONFIRMED'],
  checkin: ['PAID', 'CONFIRMED'],
  complete: ['CHECKED_IN'],
  abnormal: ['PENDING', 'CONFIRMED', 'PAID', 'CHECKED_IN']
}

const actionSchema = z.object({
  action: z.enum(['confirm', 'cancel', 'pay', 'checkin', 'complete', 'abnormal']),
  remark: z.string().optional(),
  method: z.enum(['WECHAT', 'ALIPAY', 'CASH', 'CARD', 'BALANCE', 'OTHER']).optional(),
  paidAmount: z.number().optional(),
  abnormalReason: z.enum([
    'CUSTOMER_NO_SHOW', 'CUSTOMER_EARLY_LEAVE', 'EQUIPMENT_FAILURE',
    'WEATHER_ISSUE', 'DOUBLE_BOOKING', 'STAFF_ERROR', 'OTHER'
  ]).optional(),
  abnormalRemark: z.string().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAuth(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!id) return errorResponse('参数错误', 400)

    const body = await readBody(event)
    const data = actionSchema.parse(body)

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true }
    })
    if (!booking) return errorResponse('预约不存在', 404)

    const allowedPrev = statusMap[data.action] || []
    if (!allowedPrev.includes(booking.status)) {
      return errorResponse(`当前状态 [${booking.status}] 不允许此操作`, 400)
    }

    let newStatus: BookingStatus = booking.status
    let logRemark = data.remark || ''

    switch (data.action) {
      case 'confirm':
        newStatus = 'CONFIRMED'
        logRemark = logRemark || '确认预约'
        break
      case 'cancel':
        newStatus = 'CANCELLED'
        logRemark = logRemark || '取消预约'
        break
      case 'pay':
        newStatus = 'PAID'
        const method: PaymentMethod = (data.method as PaymentMethod) || 'WECHAT'
        const paid = data.paidAmount ?? Number(booking.actualAmount)
        const payment = await prisma.payment.create({
          data: {
            paymentNo: generateOrderNo('PY'),
            bookingId: booking.id,
            userId: booking.customerId,
            amount: booking.actualAmount,
            paidAmount: paid,
            status: 'PAID' as PaymentStatus,
            method,
            paidAt: new Date(),
            subject: `场地预约-${booking.orderNo}`,
            description: logRemark || '支付预约费用'
          }
        })
        logRemark = `支付成功: ¥${paid} (${method}, 单号${payment.paymentNo})`
        break
      case 'checkin':
        newStatus = 'CHECKED_IN'
        logRemark = logRemark || '签到入场'
        await prisma.checkInRecord.create({
          data: {
            checkInNo: generateOrderNo('CI'),
            bookingId: booking.id,
            userId: booking.customerId,
            courtId: booking.courtId,
            status: 'CHECKED_IN',
            checkInTime: new Date(),
            operatorId: auth.id,
            method: 'STAFF'
          }
        })
        break
      case 'complete':
        newStatus = 'COMPLETED'
        logRemark = logRemark || '正常完成'
        await prisma.courtUsageLog.create({
          data: {
            courtId: booking.courtId,
            bookingId: booking.id,
            usageDate: new Date(),
            startTime: booking.startTime,
            endTime: booking.endTime,
            usageType: 'BOOKING',
            customerNum: booking.peopleCount,
            revenue: booking.paidAmount
          }
        })
        const uncheckIns = await prisma.checkInRecord.findMany({
          where: { bookingId: booking.id, status: { in: ['CHECKED_IN', 'PENDING'] } }
        })
        for (const ci of uncheckIns) {
          await prisma.checkInRecord.update({
            where: { id: ci.id },
            data: {
              status: 'CHECKED_OUT',
              checkOutTime: new Date()
            }
          })
        }
        break
      case 'abnormal':
        newStatus = 'ABNORMAL'
        const reason: AbnormalReason = (data.abnormalReason as AbnormalReason) || 'OTHER'
        if (!data.abnormalReason) {
          return errorResponse('异常结束必须指定原因', 400)
        }
        logRemark = `异常结束: 原因=${reason}${data.abnormalRemark ? ', 备注=' + data.abnormalRemark : ''}`
        await prisma.booking.update({
          where: { id },
          data: {
            abnormalReason: reason,
            abnormalRemark: data.abnormalRemark || null
          }
        })
        break
    }

    const oldStatus = booking.status
    await prisma.booking.update({
      where: { id },
      data: {
        status: newStatus,
        paidAmount: data.action === 'pay' ? (data.paidAmount ?? Number(booking.actualAmount)) : undefined
      }
    })

    await prisma.bookingLog.create({
      data: {
        bookingId: id,
        operatorId: auth.id,
        action: data.action.toUpperCase(),
        oldStatus,
        newStatus,
        remark: logRemark
      }
    })

    return successResponse({ id, status: newStatus, remark: logRemark }, '操作成功')
  } catch (e: any) {
    if (e instanceof z.ZodError) return errorResponse(e.errors[0].message, 400)
    return errorResponse(e.message || '操作失败', 500)
  }
})
