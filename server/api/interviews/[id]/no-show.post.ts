import prisma from '../../../utils/prisma'
import { withRetry } from '../../../utils/retry'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const result = await withRetry(async () => {
    return prisma.interview.update({
      where: { id },
      data: {
        status: 'NO_SHOW',
        candidate: {
          update: {
            noShows: {
              create: {
                interviewId: id,
                reason: body.reason,
                isFirstTime: body.isFirstTime ?? true,
                blockingAction: body.blockingAction,
                handledBy: body.handledBy,
                note: body.note
              }
            }
          }
        }
      }
    })
  }, {
    endpoint: `/api/interviews/${id}/no-show`,
    method: 'POST',
    requestBody: body,
    interviewId: id
  })

  return result.data
})
