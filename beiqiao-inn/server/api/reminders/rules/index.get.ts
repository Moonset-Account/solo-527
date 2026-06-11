import { prisma } from '~/server/utils/prisma'
import { useMockStore, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async () => {
  if (!(await isDbAvailable())) {
    const store = useMockStore()
    return store.reminderRules
  }

  const rules = await prisma.reminderRule.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return rules
})
