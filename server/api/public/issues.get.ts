import { prisma } from '../../utils/prisma'
import { ok, fail } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const where: any = {}
  if (query.phone) {
    const resident = await prisma.resident.findUnique({ where: { phone: String(query.phone) } })
    if (!resident) return ok({ total: 0, rows: [] })
    where.reporterId = resident.id
  }
  if (query.keyword) {
    where.OR = [
      { title: { contains: String(query.keyword) } },
      { code: { contains: String(query.keyword) } }
    ]
  }
  where.published = true
  const page = Math.max(1, Number(query.page) || 1)
  const size = Math.min(100, Number(query.size) || 20)
  const [total, rows] = await Promise.all([
    prisma.issue.count({ where }),
    prisma.issue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
      include: {
        photos: { take: 6 },
        reviews: { orderBy: { reviewedAt: 'desc' }, take: 3 },
        gridEvents: { take: 5 }
      }
    })
  ])
  return ok({ total, rows, page, size })
})
