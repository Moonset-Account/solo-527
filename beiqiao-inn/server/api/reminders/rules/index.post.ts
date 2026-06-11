import { prisma } from '~/server/utils/prisma'
import { invalidateCache } from '~/server/utils/redis'
import { isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!(await isDbAvailable())) {
    return { id: Date.now(), name: body.name, condition: body.condition, priority: body.priority, enabled: body.enabled ?? true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  }

  const rule = await prisma.reminderRule.create({
    data: {
      name: body.name,
      condition: body.condition,
      priority: body.priority,
      enabled: body.enabled ?? true,
    },
  })
  await invalidateCache('stats:dashboard')
  return rule
})
