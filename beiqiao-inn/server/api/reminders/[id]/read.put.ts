import { prisma } from '~/server/utils/prisma'
import { useMockStore, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!(await isDbAvailable())) {
    const store = useMockStore()
    return store.markReminderRead(id)
  }

  const reminder = await prisma.reminder.update({
    where: { id },
    data: { isRead: true },
  })
  return reminder
})
