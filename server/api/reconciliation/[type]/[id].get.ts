import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse, errorResponse } from '~/server/utils/response'
import { getDataSource } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['ADMIN', 'OPERATOR', 'FINANCE'])

  const type = getRouterParam(event, 'type') as string
  const id = parseInt(getRouterParam(event, 'id') || '0')

  let data: any = null
  let sourceType = ''

  switch (type) {
    case 'medical-record':
      sourceType = 'MEDICAL_RECORD'
      data = await prisma.medicalRecord.findUnique({
        where: { id },
        include: {
          patient: true,
          creator: { select: { id: true, name: true } },
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
      break

    case 'follow-up':
      sourceType = 'FOLLOW_UP_TASK'
      data = await prisma.followUpTask.findUnique({
        where: { id },
        include: {
          patient: true,
          course: true,
          assignee: { select: { id: true, name: true } },
          followUpRecords: {
            orderBy: { recordDate: 'desc' },
            include: {
              operator: { select: { id: true, name: true } }
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
      break

    case 'treatment-course':
      sourceType = 'TREATMENT_COURSE'
      data = await prisma.treatmentCourse.findUnique({
        where: { id },
        include: {
          patient: true,
          medicalRecord: true,
          plan: true,
          lostHandler: { select: { id: true, name: true } },
          followUpTasks: {
            orderBy: { scheduledDate: 'desc' }
          },
          billingRecords: {
            orderBy: { createdAt: 'desc' }
          },
          auditLogs: {
            orderBy: { createdAt: 'desc' },
            include: {
              operator: { select: { id: true, name: true } }
            }
          }
        }
      })
      break

    case 'billing':
      sourceType = 'BILLING_RECORD'
      data = await prisma.billingRecord.findUnique({
        where: { id },
        include: {
          patient: true,
          medicalRecord: true,
          course: true,
          creator: { select: { id: true, name: true } }
        }
      })
      break

    case 'patient-archive':
      sourceType = 'PATIENT_ARCHIVE'
      data = await prisma.patientArchive.findUnique({
        where: { id },
        include: {
          patient: true
        }
      })
      break

    default:
      return errorResponse('不支持的类型', 400)
  }

  if (!data) {
    return errorResponse('数据不存在', 404)
  }

  const dataSources = await getDataSource(sourceType, id)

  return successResponse({
    data,
    dataSources,
    sourceType
  }, '来源数据追溯成功')
})
