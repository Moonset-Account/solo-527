import { prisma } from '../../utils/prisma'
import { ok } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const where: any = {}
  if (query.issueId) where.issueId = Number(query.issueId)
  if (query.rectificationId) where.rectificationId = Number(query.rectificationId)
  const size = Math.min(500, Number(query.size) || 200)
  const rows = await prisma.operationLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: size
  })
  return ok(rows)
})
