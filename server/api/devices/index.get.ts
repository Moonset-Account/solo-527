import { prisma } from '../../plugins/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const query = getQuery(event)

  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.deviceInspection.findMany({ orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
    prisma.deviceInspection.count()
  ])

  return { data: items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
})
