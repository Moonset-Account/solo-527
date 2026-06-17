import { prisma } from '../../utils/db'
import { getUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const query = getQuery(event)
  const { userId, status, type } = query
  const uid = userId || session.user.id

  const where: any = { userId: String(uid) }
  if (status && status !== 'ALL') where.status = status
  if (type && type !== 'ALL') where.reminderType = type

  const reminders = await prisma.reminder.findMany({
    where,
    include: {
      contract: { select: { id: true, contractNo: true, title: true, status: true } }
    },
    orderBy: { deadlineDate: 'asc' }
  })

  return reminders
})
