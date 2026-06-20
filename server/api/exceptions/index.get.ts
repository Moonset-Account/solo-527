import { prisma } from '../../utils/prisma'
import { ok } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const where: any = {}
  if (query.date) {
    const d = new Date(String(query.date))
    where.happenedAt = { gte: new Date(d.setHours(0, 0, 0, 0)), lte: new Date(d.setHours(23, 59, 59, 999)) }
  }
  if (query.issueCode) where.issueCode = String(query.issueCode)
  if (query.status) where.status = Number(query.status)
  const page = Math.max(1, Number(query.page) || 1)
  const size = Math.min(200, Number(query.size) || 50)
  const [total, rows] = await Promise.all([
    prisma.apiException.count({ where }),
    prisma.apiException.findMany({
      where,
      orderBy: { happenedAt: 'desc' },
      skip: (page - 1) * size,
      take: size
    })
  ])
  return ok({ total, rows, page, size })
})
