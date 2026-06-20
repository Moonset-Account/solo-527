import { prisma } from '../../utils/prisma'
import { ok } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const where: any = {}
  if (query.startDate && query.endDate) {
    where.date = {
      gte: new Date(String(query.startDate)),
      lte: new Date(String(query.endDate))
    }
  }
  if (query.gridNo) where.gridNo = String(query.gridNo)
  const rows = await prisma.patrolStat.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 365
  })
  return ok(rows)
})
