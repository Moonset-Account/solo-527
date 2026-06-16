import prisma from '../../utils/prisma'
import { withRetry } from '../../utils/retry'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = await withRetry(async () => {
    return prisma.checkIn.create({
      data: {
        candidateId: body.candidateId,
        interviewId: body.interviewId,
        checkInType: body.checkInType,
        checkedAt: body.checkedAt ? new Date(body.checkedAt) : new Date(),
        location: body.location,
        ipAddress: body.ipAddress,
        note: body.note
      }
    })
  }, {
    endpoint: '/api/check-ins',
    method: 'POST',
    requestBody: body,
    interviewId: body.interviewId
  })

  return result.data
})
