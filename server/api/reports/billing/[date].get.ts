import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse, errorResponse } from '~/server/utils/response'
import dayjs from 'dayjs'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['ADMIN', 'OPERATOR', 'FINANCE'])

  const date = getRouterParam(event, 'date') as string

  if (!date || !dayjs(date).isValid()) {
    return errorResponse('日期格式不正确', 400)
  }

  const startDate = dayjs(date).startOf('day').toDate()
  const endDate = dayjs(date).endOf('day').toDate()

  const toNum = (v: any) => (typeof v?.toNumber === 'function' ? v.toNumber() : Number(v || 0))

  const billingRecords = await prisma.billingRecord.findMany({
    where: {
      paymentDate: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      patient: {
        select: { id: true, patientNo: true, name: true, phone: true, status: true }
      },
      medicalRecord: {
        select: { id: true, recordNo: true, diagnosis: true, visitDate: true }
      },
      course: {
        select: { id: true, courseNo: true, name: true, isLost: true, lostReason: true }
      },
      creator: {
        select: { id: true, name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const summary = {
    totalAmount: billingRecords.reduce((sum, b) => sum + toNum(b.amount), 0),
    paidAmount: billingRecords.reduce((sum, b) => sum + toNum(b.paidAmount), 0),
    unpaidAmount: billingRecords.reduce((sum, b) => sum + (toNum(b.amount) - toNum(b.paidAmount)), 0),
    count: billingRecords.length,
    paidCount: billingRecords.filter(b => b.status === 'PAID').length,
    unpaidCount: billingRecords.filter(b => b.status !== 'PAID').length,
    patientCount: new Set(billingRecords.map(b => b.patientId)).size
  }

  return successResponse({
    date,
    summary,
    billingRecords
  }, '日收费明细获取成功，支持下钻到具体单据')
})
