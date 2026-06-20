import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse } from '~/server/utils/response'
import dayjs from 'dayjs'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['ADMIN', 'OPERATOR', 'FINANCE'])

  const query = getQuery(event)
  const month = query.month as string || dayjs().format('YYYY-MM')
  const startDate = dayjs(month).startOf('month').toDate()
  const endDate = dayjs(month).endOf('month').toDate()

  const [medicalRecords, followUpTasks, billingRecords, patientArchives] = await Promise.all([
    prisma.medicalRecord.findMany({
      where: {
        visitDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        patient: {
          select: { id: true, patientNo: true, name: true }
        },
        creator: {
          select: { id: true, name: true }
        },
        treatmentCourses: {
          select: { id: true, courseNo: true, name: true }
        },
        billingRecords: {
          select: { id: true, billNo: true, amount: true }
        },
        auditLogs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            operator: { select: { id: true, name: true } }
          }
        }
      }
    }),
    prisma.followUpTask.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        patient: {
          select: { id: true, patientNo: true, name: true }
        },
        course: {
          select: { id: true, courseNo: true, name: true }
        },
        assignee: {
          select: { id: true, name: true }
        },
        followUpRecords: {
          orderBy: { recordDate: 'desc' },
          include: {
            operator: { select: { id: true, name: true } }
          }
        },
        auditLogs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            operator: { select: { id: true, name: true } }
          }
        }
      }
    }),
    prisma.billingRecord.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        patient: {
          select: { id: true, patientNo: true, name: true }
        },
        medicalRecord: {
          select: { id: true, recordNo: true, diagnosis: true }
        },
        course: {
          select: { id: true, courseNo: true, name: true }
        },
        creator: {
          select: { id: true, name: true }
        }
      }
    }),
    prisma.patientArchive.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        patient: {
          select: { id: true, patientNo: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ])

  const toNum = (v: any) => (typeof v?.toNumber === 'function' ? v.toNumber() : Number(v || 0))

  const summary = {
    medicalRecordCount: medicalRecords.length,
    followUpTaskCount: followUpTasks.length,
    completedFollowUpCount: followUpTasks.filter(f => f.status === 'COMPLETED').length,
    billingRecordCount: billingRecords.length,
    totalAmount: billingRecords.reduce((sum, b) => sum + toNum(b.amount), 0),
    paidAmount: billingRecords.reduce((sum, b) => sum + toNum(b.paidAmount), 0),
    unpaidAmount: billingRecords.reduce((sum, b) => sum + (toNum(b.amount) - toNum(b.paidAmount)), 0),
    patientArchiveCount: patientArchives.length
  }

  return successResponse({
    month,
    summary,
    medicalRecords,
    followUpTasks,
    billingRecords,
    patientArchives
  }, '月底核对数据获取成功')
})
