import prisma from '../../../utils/prisma'
import { withRetry } from '../../../utils/retry'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const result = await withRetry(async () => {
    return prisma.assessment.update({
      where: { id },
      data: {
        scoreAfter: body.scoreAfter,
        questionsAfter: body.questionsAfter as any,
        answersAfter: body.answersAfter as any,
        status: 'COMPLETED',
        note: body.note
      }
    })
  }, {
    endpoint: `/api/assessments/${id}/complete`,
    method: 'POST',
    requestBody: body
  })

  return result.data
})
