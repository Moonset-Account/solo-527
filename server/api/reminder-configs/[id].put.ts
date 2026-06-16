import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  return prisma.reminderConfig.update({
    where: { id },
    data: {
      name: body.name,
      thresholdMinutes: body.thresholdMinutes,
      thresholdHours: body.thresholdHours,
      thresholdDays: body.thresholdDays,
      severity: body.severity,
      isBlocking: body.isBlocking,
      isEnabled: body.isEnabled,
      messageTemplate: body.messageTemplate
    }
  })
})
