import { prisma } from '../../../utils/prisma'
import { ok, fail } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  if (!code) throw fail('缺少单据编号', 400)
  const query = getQuery(event)
  const where: any = { code }
  if (query.phone) {
    const resident = await prisma.resident.findUnique({ where: { phone: String(query.phone) } })
    if (resident) where.reporterId = resident.id
  }
  const issue = await prisma.issue.findFirst({
    where,
    include: {
      reporter: { select: { name: true, phone: true, community: true } },
      photos: true,
      votes: { include: { resident: { select: { name: true, phone: true } } } },
      rectifications: { include: { photos: true }, orderBy: { createdAt: 'asc' } },
      reviews: { include: { photos: true }, orderBy: { reviewedAt: 'asc' } },
      gridEvents: true,
      operationLogs: { orderBy: { createdAt: 'asc' }, take: 200 }
    }
  })
  if (!issue) throw fail('未找到该议题或权限不足', 404, 404)
  return ok(issue)
})
