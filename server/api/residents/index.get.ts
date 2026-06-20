import { prisma } from '../../utils/prisma'
import { ok, fail } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const where: any = {}
  if (query.phone) where.phone = String(query.phone)
  if (query.keyword) where.name = { contains: String(query.keyword) }
  const page = Math.max(1, Number(query.page) || 1)
  const size = Math.min(200, Number(query.size) || 50)
  const [total, rows] = await Promise.all([
    prisma.resident.count({ where }),
    prisma.resident.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
      include: { _count: { select: { issues: true, votes: true } } }
    })
  ])
  return ok({ total, rows, page, size })
})
