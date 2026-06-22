import { prisma } from '../../plugins/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)

  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const skip = (page - 1) * pageSize
  const onlyUnread = query.unread === 'true'

  const where: Record<string, unknown> = { userId: user.id }
  if (onlyUnread) where.isRead = false

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        alert: { select: { id: true, alertNo: true } },
        change: { select: { id: true, changeNo: true } }
      }
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } })
  ])

  return {
    data: notifications,
    total,
    unreadCount,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
})
