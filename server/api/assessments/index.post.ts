import prisma from '../../utils/prisma'
import { withRetry } from '../../utils/retry'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = await withRetry(async () => {
    return prisma.assessment.create({
      data: {
        candidateId: body.candidateId,
        type: body.type,
        title: body.title,
        scoreBefore: body.scoreBefore,
        questionsBefore: body.questionsBefore as any,
        answersBefore: body.answersBefore as any,
        status: 'IN_PROGRESS',
        takenAt: new Date()
      }
    })
  }, {
    endpoint: '/api/assessments',
    method: 'POST',
    requestBody: body
  })

  return result.data
})
