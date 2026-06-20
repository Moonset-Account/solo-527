import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse } from '~/server/utils/response'
import { cacheGet, cacheSet } from '~/server/utils/redis'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const keyword = query.keyword as string
  const status = query.status as string

  const cacheKey = `patients:${page}:${pageSize}:${keyword || ''}:${status || ''}`
  const cached = await cacheGet(cacheKey)
  if (cached) {
    return successResponse(cached.data, '获取成功', cached.total)
  }

  const where: any = {}
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { phone: { contains: keyword } },
      { patientNo: { contains: keyword } }
    ]
  }
  if (status) where.status = status

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            medicalRecords: true,
            treatmentCourses: true,
            followUpTasks: true
          }
        }
      }
    }),
    prisma.patient.count({ where })
  ])

  await cacheSet(cacheKey, { data: patients, total }, 300)

  return successResponse(patients, '获取成功', total)
})
