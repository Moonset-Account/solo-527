import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)

  const limit = Number(query.limit) || 20
  const page = Number(query.page) || 1

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.notification.count({ where: { userId: user.id } }),
  ])

  return {
    data: notifications,
    total,
    page,
    pageSize: limit,
  }
})
