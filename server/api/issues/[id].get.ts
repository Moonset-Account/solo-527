import { prisma } from '../../utils/prisma'
import { ok, fail } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw fail('缺少议题ID', 400)
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      reporter: { select: { id: true, name: true, phone: true, community: true, address: true } },
      photos: true,
      votes: { include: { resident: { select: { id: true, name: true, phone: true } } }, orderBy: { createdAt: 'desc' } },
      rectifications: { include: { photos: true }, orderBy: { createdAt: 'desc' } },
      reviews: { include: { photos: true }, orderBy: { reviewedAt: 'desc' } },
      gridEvents: { orderBy: { occurredAt: 'desc' } },
      todos: { orderBy: { createdAt: 'desc' } },
      operationLogs: { orderBy: { createdAt: 'desc' }, take: 200 }
    }
  })
  if (!issue) throw fail('议题不存在', 404, 404)
  return ok(issue)
})
