import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const id = parseInt(getRouterParam(event, 'id') || '0')

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      medicalRecords: {
        orderBy: { visitDate: 'desc' },
        take: 10
      },
      treatmentCourses: {
        orderBy: { startDate: 'desc' },
        include: {
          plan: true
        }
      },
      followUpTasks: {
        orderBy: { scheduledDate: 'desc' },
        take: 10,
        include: {
          followUpRecords: {
            orderBy: { recordDate: 'desc' }
          }
        }
      },
      billingRecords: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      patientArchives: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!patient) {
    throw createError({
      statusCode: 404,
      statusMessage: '患者不存在'
    })
  }

  return successResponse(patient, '获取成功')
})
