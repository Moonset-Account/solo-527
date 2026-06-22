import { prisma } from '../../plugins/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)

  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}
  if (query.status) where.status = query.status

  const [items, total] = await Promise.all([
    prisma.accountApplication.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
    prisma.accountApplication.count({ where })
  ])

  return { data: items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
})
