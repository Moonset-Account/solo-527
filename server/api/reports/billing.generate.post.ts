import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse, errorResponse } from '~/server/utils/response'
import { createAuditLog, createDataSource } from '~/server/utils/audit'
import dayjs from 'dayjs'

const generateSchema = z.object({
  period: z.string().min(1, '统计月份不能为空').regex(/^\d{4}-\d{2}$/, '月份格式为 YYYY-MM')
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event, ['ADMIN', 'OPERATOR', 'FINANCE'])

  try {
    const body = await readBody(event)
    const { period } = generateSchema.parse(body)

    const startDate = dayjs(`${period}-01`).startOf('month').toDate()
    const endDate = dayjs(`${period}-01`).endOf('month').toDate()

    const toNum = (v: any) => (typeof v?.toNumber === 'function' ? v.toNumber() : Number(v || 0))

    const billingRecords = await prisma.billingRecord.findMany({
      where: {
        paymentDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        patient: { select: { id: true, patientNo: true, name: true, firstVisitDate: true } },
        medicalRecord: { select: { id: true, recordNo: true, diagnosis: true } },
        course: { select: { id: true, courseNo: true, name: true, isLost: true, lostReason: true } },
        creator: { select: { id: true, name: true } }
      },
      orderBy: { paymentDate: 'desc' }
    })

    if (billingRecords.length === 0) {
      return errorResponse('该月份没有收费记录', 400)
    }

    const lostCourses = billingRecords.filter(b => b.course?.isLost)
    const lostPatientIds = [...new Set(lostCourses.map(b => b.patientId))]
    const patientIds = [...new Set(billingRecords.map(b => b.patientId))]
    const newPatientCount = billingRecords.filter(b =>
      b.patient?.firstVisitDate && dayjs(b.patient.firstVisitDate).isAfter(dayjs(startDate).subtract(1, 'day'))
    ).length

    const summary = {
      totalAmount: billingRecords.reduce((sum, b) => sum + toNum(b.amount), 0),
      paidAmount: billingRecords.reduce((sum, b) => sum + toNum(b.paidAmount), 0),
      unpaidAmount: billingRecords.reduce((sum, b) => sum + (toNum(b.amount) - toNum(b.paidAmount)), 0),
      patientCount: patientIds.length,
      newPatientCount,
      lostPatientCount: lostPatientIds.length
    }

    const reportNo = `RPT${period.replace('-', '')}`

    const report = await prisma.$transaction(async (tx) => {
      const existing = await tx.billingReport.findUnique({
        where: { reportNo }
      })
      if (existing) {
        throw new Error(`该月份报表 ${reportNo} 已存在`)
      }

      const newReport = await tx.billingReport.create({
        data: {
          reportNo,
          reportDate: new Date(),
          period,
          totalAmount: summary.totalAmount,
          paidAmount: summary.paidAmount,
          unpaidAmount: summary.unpaidAmount,
          patientCount: summary.patientCount,
          newPatientCount: summary.newPatientCount,
          lostPatientCount: summary.lostPatientCount,
          remark: `${period} 收费汇总报表，共 ${billingRecords.length} 笔单据`
        }
      })

      await tx.billingRecord.updateMany({
        where: {
          id: { in: billingRecords.map(b => b.id) }
        },
        data: {
          reportId: newReport.id
        }
      })

      const archiveNo = `ARC-BILLING-${period.replace('-', '')}`
      await tx.patientArchive.create({
        data: {
          archiveNo,
          patientId: 1,
          archiveType: 'BILLING_RECONCILIATION',
          summary: `${period} 收费核对报表：${billingRecords.length} 笔单据，总金额 ${summary.totalAmount}`,
          content: {
            period,
            reportNo,
            totalAmount: summary.totalAmount,
            paidAmount: summary.paidAmount,
            unpaidAmount: summary.unpaidAmount,
            recordCount: billingRecords.length,
            patientCount: summary.patientCount,
            newPatientCount: summary.newPatientCount,
            lostPatientCount: summary.lostPatientCount,
            generatedBy: user.name
          }
        }
      })

      for (const br of billingRecords) {
        await createDataSource(
          'BILLING_REPORT',
          newReport.id,
          reportNo,
          'BILLING_RECORD',
          br.id,
          br.billNo,
          'REPORT_DETAIL',
          `收费报表 ${reportNo} 明细单据`
        )
      }

      await createAuditLog(user, {
        operationType: 'GENERATE_REPORT',
        sourceType: 'BILLING_REPORT',
        sourceId: newReport.id,
        sourceNo: reportNo,
        newValue: newReport,
        changeReason: `生成 ${period} 收费报表`,
        billingId: newReport.id
      })

      return newReport
    })

    return successResponse({
      report,
      recordCount: billingRecords.length,
      summary,
      period,
      billingRecords
    }, '收费报表生成成功，已关联所有明细单据')
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse(error.message || '操作失败', 500)
  }
})
