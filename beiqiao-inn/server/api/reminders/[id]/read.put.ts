import { prisma } from '~/server/utils/prisma'
import { isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!(await isDbAvailable())) {
    return { id, isRead: true }
  }

  const reminder = await prisma.reminder.update({
    where: { id },
    data: { isRead: true },
  })
  return reminder
})
