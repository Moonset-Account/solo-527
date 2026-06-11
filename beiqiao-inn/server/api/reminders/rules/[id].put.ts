import { prisma } from '~/server/utils/prisma'
import { isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  if (!(await isDbAvailable())) {
    return { id, ...body, updatedAt: new Date().toISOString() }
  }

  const rule = await prisma.reminderRule.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.condition !== undefined && { condition: body.condition }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.enabled !== undefined && { enabled: body.enabled }),
    },
  })
  return rule
})
