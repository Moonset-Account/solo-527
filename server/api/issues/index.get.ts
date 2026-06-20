import { prisma } from '../../utils/prisma'
import { ok, fail, genIssueCode } from '../../utils/response'
import { recordOperationLog } from '../../utils/operation-log'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const size = Math.min(100, Number(query.size) || 20)
  const where: any = {}
  if (query.keyword) {
    where.OR = [
      { title: { contains: String(query.keyword) } },
      { code: { contains: String(query.keyword) } }
    ]
  }
  if (query.status) where.status = String(query.status)
  if (query.category) where.category = String(query.category)
  if (query.community) where.community = String(query.community)
  if (query.published === '1') where.published = true

  const [total, rows] = await Promise.all([
    prisma.issue.count({ where }),
    prisma.issue.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, name: true, phone: true } },
        _count: { select: { votes: true, rectifications: true, reviews: true, gridEvents: true, photos: true } }
      }
    })
  ])
  return ok({ total, rows, page, size })
})
