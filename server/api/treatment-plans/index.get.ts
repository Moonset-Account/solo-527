import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const status = query.status as string
  const type = query.type as string
  const keyword = query.keyword as string

  const where: any = {}
  if (status) where.status = status
  if (type) where.type = type
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { planNo: { contains: keyword } }
    ]
  }

  const [plans, total] = await Promise.all([
    prisma.treatmentPlan.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            treatmentCourses: true
          }
        }
      }
    }),
    prisma.treatmentPlan.count({ where })
  ])

  return successResponse(plans, '获取成功', total)
})
