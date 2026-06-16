import prisma from '../../../utils/prisma'
import { withRetry } from '../../../utils/retry'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = await withRetry(async () => {
    return prisma.interview.create({
      data: {
        candidateId: body.candidateId,
        interviewerId: body.interviewerId,
        title: body.title,
        type: body.type,
        scheduledAt: new Date(body.scheduledAt),
        durationMin: body.durationMin || 60,
        location: body.location,
        meetingUrl: body.meetingUrl,
        notes: body.notes
      }
    })
  }, {
    endpoint: '/api/interviews',
    method: 'POST',
    requestBody: body,
    interviewId: undefined
  })

  if (!result.data) {
    throw createError({ statusCode: 500, statusMessage: '创建面试失败，请查看重试日志' })
  }

  return result.data
})
