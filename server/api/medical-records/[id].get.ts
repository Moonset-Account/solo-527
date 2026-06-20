import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse } from '~/server/utils/response'
import { getDataSource } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const id = parseInt(getRouterParam(event, 'id') || '0')

  const record = await prisma.medicalRecord.findUnique({
    where: { id },
    include: {
      patient: true,
      creator: { select: { id: true, name: true } },
      updater: { select: { id: true, name: true } },
      treatmentCourses: true,
      billingRecords: true,
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        include: {
          operator: { select: { id: true, name: true } }
        }
      }
    }
  })

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: '病历不存在'
    })
  }

  const dataSources = await getDataSource('MEDICAL_RECORD', id)

  return successResponse({
    ...record,
    dataSources
  }, '获取成功')
})
