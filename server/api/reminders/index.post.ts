import prisma from '../../../utils/prisma'
import { withRetry } from '../../../utils/retry'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = await withRetry(async () => {
    return prisma.reminder.create({
      data: {
        candidateId: body.candidateId,
        interviewId: body.interviewId,
        type: body.type,
        severity: body.severity,
        title: body.title,
        message: body.message,
        sendAt: new Date(body.sendAt)
      }
    })
  }, {
    endpoint: '/api/reminders',
    method: 'POST',
    requestBody: body,
    interviewId: body.interviewId
  })

  return result.data
})
