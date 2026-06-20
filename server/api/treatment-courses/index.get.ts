import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const patientId = query.patientId ? parseInt(query.patientId as string) : undefined
  const planId = query.planId ? parseInt(query.planId as string) : undefined
  const status = query.status as string
  const isLost = query.isLost as string

  const where: any = {}
  if (patientId) where.patientId = patientId
  if (planId) where.planId = planId
  if (status) where.status = status
  if (isLost !== undefined) where.isLost = isLost === 'true'

  const [courses, total] = await Promise.all([
    prisma.treatmentCourse.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { startDate: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            patientNo: true,
            name: true,
            phone: true
          }
        },
        plan: {
          select: {
            id: true,
            planNo: true,
            name: true,
            type: true
          }
        },
        medicalRecord: {
          select: {
            id: true,
            recordNo: true,
            diagnosis: true
          }
        },
        lostHandler: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            followUpTasks: true,
            billingRecords: true
          }
        }
      }
    }),
    prisma.treatmentCourse.count({ where })
  ])

  return successResponse(courses, '获取成功', total)
})
