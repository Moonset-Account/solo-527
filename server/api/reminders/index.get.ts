import { prisma } from '../../utils/db'
import { getUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const query = getQuery(event)
  const { userId, status, type } = query
  const currentRole = session.user.role
  const currentUserId = session.user.id

  const where: any = {}

  const isManager = currentRole === 'LEGAL_MANAGER' || currentRole === 'ADMIN'

  if (isManager) {
    if (userId && userId !== 'ALL') {
      where.userId = String(userId)
    }
  } else {
    where.userId = String(userId || currentUserId)
  }

  if (status && status !== 'ALL') where.status = status
  if (type && type !== 'ALL') where.reminderType = type

  const reminders = await prisma.reminder.findMany({
    where,
    include: {
      contract: { select: { id: true, contractNo: true, title: true, status: true } },
      user: { select: { id: true, name: true, role: true, department: true } }
    },
    orderBy: { deadlineDate: 'asc' },
    take: isManager ? 100 : 50
  })

  return reminders
})
