import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const patientId = query.patientId ? parseInt(query.patientId as string) : undefined
  const keyword = query.keyword as string
  const startDate = query.startDate as string
  const endDate = query.endDate as string

  const where: any = {}
  if (patientId) where.patientId = patientId
  if (keyword) {
    where.OR = [
      { diagnosis: { contains: keyword } },
      { chiefComplaint: { contains: keyword } },
      { recordNo: { contains: keyword } }
    ]
  }
  if (startDate && endDate) {
    where.visitDate = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  }

  const [records, total] = await Promise.all([
    prisma.medicalRecord.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { visitDate: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            patientNo: true,
            name: true,
            phone: true
          }
        },
        creator: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            treatmentCourses: true,
            billingRecords: true
          }
        }
      }
    }),
    prisma.medicalRecord.count({ where })
  ])

  return successResponse(records, '获取成功', total)
})
