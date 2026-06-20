import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['ADMIN', 'OPERATOR', 'FINANCE'])

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const patientId = query.patientId ? parseInt(query.patientId as string) : undefined
  const courseId = query.courseId ? parseInt(query.courseId as string) : undefined
  const status = query.status as string
  const startDate = query.startDate as string
  const endDate = query.endDate as string

  const where: any = {}
  if (patientId) where.patientId = patientId
  if (courseId) where.courseId = courseId
  if (status) where.status = status
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  }

  const [records, total] = await Promise.all([
    prisma.billingRecord.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            patientNo: true,
            name: true,
            phone: true
          }
        },
        medicalRecord: {
          select: {
            id: true,
            recordNo: true,
            diagnosis: true
          }
        },
        course: {
          select: {
            id: true,
            courseNo: true,
            name: true,
            isLost: true
          }
        },
        creator: {
          select: { id: true, name: true }
        }
      }
    }),
    prisma.billingRecord.count({ where })
  ])

  return successResponse(records, '获取成功', total)
})
