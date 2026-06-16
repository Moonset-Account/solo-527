import prisma from '../../../utils/prisma'
import { withRetry } from '../../../utils/retry'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { toStage, reason, changedBy } = body

  const existing = await prisma.candidate.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: '候选人不存在' })
  }
  if (existing.currentStage === toStage) {
    return { message: '候选人已在该阶段', candidate: existing }
  }

  const result = await withRetry(async () => {
    return prisma.candidate.update({
      where: { id },
      data: {
        currentStage: toStage,
        stageHistory: {
          create: {
            fromStage: existing.currentStage,
            toStage,
            reason,
            changedBy
          }
        }
      }
    })
  }, {
    endpoint: `/api/candidates/${id}/stage`,
    method: 'POST',
    requestBody: body
  })

  return result.data
})
