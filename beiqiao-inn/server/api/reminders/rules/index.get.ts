import { prisma } from '~/server/utils/prisma'
import { mockReminderRules, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async () => {
  if (!(await isDbAvailable())) {
    return mockReminderRules
  }

  const rules = await prisma.reminderRule.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return rules
})
