import { prisma } from '../../utils/prisma'
import { ok } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const where: any = {}
  if (query.from === 'timeout') where.fromTimeout = true
  if (query.done === '0') where.done = false
  if (query.done === '1') where.done = true
  if (query.assignee) where.assignee = String(query.assignee)

  const rows = await prisma.todo.findMany({
    where,
    include: { issue: { select: { id: true, code: true, title: true, status: true, gridNo: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500
  })
  return ok(rows)
})
