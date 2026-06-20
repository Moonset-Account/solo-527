import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse } from '~/server/utils/response'
import { getDataSource } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const id = parseInt(getRouterParam(event, 'id') || '0')

  const course = await prisma.treatmentCourse.findUnique({
    where: { id },
    include: {
      patient: {
        select: { id: true, patientNo: true, name: true, phone: true }
      },
      medicalRecord: {
        select: { id: true, recordNo: true, diagnosis: true }
      },
      plan: {
        select: { id: true, planNo: true, name: true }
      },
      lostHandler: {
        select: { id: true, name: true }
      },
      followUpTasks: {
        orderBy: { scheduledDate: 'desc' },
        include: {
          assignee: { select: { id: true, name: true } }
        }
      },
      billingRecords: {
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true } }
        }
      },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        include: {
          operator: { select: { id: true, name: true } }
        }
      }
    }
  })

  if (!course) {
    throw createError({
      statusCode: 404,
      statusMessage: '疗程不存在'
    })
  }

  const dataSources = await getDataSource('TREATMENT_COURSE', id)

  return successResponse({
    ...course,
    dataSources
  }, '获取成功')
})
