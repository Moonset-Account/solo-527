import prisma from '../../../utils/prisma'
import { withRetry } from '../../../utils/retry'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const result = await withRetry(async () => {
    return prisma.interview.update({
      where: { id },
      data: {
        title: body.title,
        type: body.type,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        durationMin: body.durationMin,
        location: body.location,
        meetingUrl: body.meetingUrl,
        status: body.status,
        qualityScore: body.qualityScore,
        qualityDetail: body.qualityDetail,
        feedback: body.feedback,
        notes: body.notes,
        interviewerId: body.interviewerId
      }
    })
  }, {
    endpoint: `/api/interviews/${id}`,
    method: 'PUT',
    requestBody: body,
    interviewId: id
  })

  return result.data
})
