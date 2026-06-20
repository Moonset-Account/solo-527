import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse } from '~/server/utils/response'
import dayjs from 'dayjs'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['ADMIN', 'OPERATOR', 'FINANCE'])

  const query = getQuery(event)
  const startDate = query.startDate ? dayjs(query.startDate as string).toDate() : dayjs().startOf('month').toDate()
  const endDate = query.endDate ? dayjs(query.endDate as string).toDate() : dayjs().endOf('month').toDate()
  const groupBy = query.groupBy as string || 'day'

  const billingRecords = await prisma.billingRecord.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      patient: {
        select: { id: true, patientNo: true, name: true, status: true }
      },
      medicalRecord: {
        select: { id: true, recordNo: true, diagnosis: true }
      },
      course: {
        select: { id: true, courseNo: true, name: true, isLost: true }
      },
      creator: {
        select: { id: true, name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const lostCourses = billingRecords.filter(b => b.course?.isLost)
  const lostPatientIds = [...new Set(lostCourses.map(b => b.patientId))]

  let dailyData: any[] = []

  if (groupBy === 'day') {
    const dayMap = new Map()
    billingRecords.forEach(record => {
      const day = dayjs(record.createdAt).format('YYYY-MM-DD')
      if (!dayMap.has(day)) {
        dayMap.set(day, {
          date: day,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          count: 0,
          patientCount: new Set()
        })
      }
      const data = dayMap.get(day)
      data.totalAmount += record.amount.toNumber()
      data.paidAmount += record.paidAmount.toNumber()
      data.unpaidAmount += (record.amount.toNumber() - record.paidAmount.toNumber())
      data.count++
      data.patientCount.add(record.patientId)
    })

    dailyData = Array.from(dayMap.values()).map(d => ({
      ...d,
      patientCount: d.patientCount.size
    })).sort((a, b) => a.date.localeCompare(b.date))
  }

  const summary = {
    totalAmount: billingRecords.reduce((sum, b) => sum + b.amount.toNumber(), 0),
    paidAmount: billingRecords.reduce((sum, b) => sum + b.paidAmount.toNumber(), 0),
    unpaidAmount: billingRecords.reduce((sum, b) => sum + (b.amount.toNumber() - b.paidAmount.toNumber()), 0),
    totalCount: billingRecords.length,
    paidCount: billingRecords.filter(b => b.status === 'PAID').length,
    unpaidCount: billingRecords.filter(b => b.status === 'UNPAID').length,
    patientCount: new Set(billingRecords.map(b => b.patientId)).size,
    newPatientCount: billingRecords.filter(b => dayjs(b.patient.firstVisitDate).isAfter(dayjs(startDate).subtract(1, 'day'))).length,
    lostPatientCount: lostPatientIds.length,
    lostAmount: lostCourses.reduce((sum, b) => sum + b.amount.toNumber(), 0)
  }

  return successResponse({
    startDate: dayjs(startDate).format('YYYY-MM-DD'),
    endDate: dayjs(endDate).format('YYYY-MM-DD'),
    summary,
    dailyData,
    billingRecords,
    lostCourses
  }, '收费报表获取成功')
})
