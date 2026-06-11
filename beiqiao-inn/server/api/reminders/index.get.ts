import { prisma } from '~/server/utils/prisma'
import { mockReminders, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const where: any = {}
  if (query.priority) where.priority = query.priority
  if (query.isRead !== undefined) where.isRead = query.isRead === 'true'

  if (!(await isDbAvailable())) {
    let filtered = [...mockReminders]
    if (where.priority) filtered = filtered.filter(r => r.priority === where.priority)
    if (query.isRead !== undefined) filtered = filtered.filter(r => r.isRead === where.isRead)
    return filtered
  }

  const reminders = await prisma.reminder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { rule: true },
  })
  return reminders
})
