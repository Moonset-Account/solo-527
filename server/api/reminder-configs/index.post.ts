import prisma from '../../../utils/prisma'
import { withRetry } from '../../../utils/retry'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = await withRetry(async () => {
    return prisma.reminderConfig.create({
      data: {
        name: body.name,
        triggerType: body.triggerType,
        thresholdMinutes: body.thresholdMinutes,
        thresholdHours: body.thresholdHours,
        thresholdDays: body.thresholdDays,
        severity: body.severity,
        isBlocking: body.isBlocking || false,
        isEnabled: body.isEnabled !== false,
        messageTemplate: body.messageTemplate
      }
    })
  }, {
    endpoint: '/api/reminder-configs',
    method: 'POST',
    requestBody: body
  })

  return result.data
})
