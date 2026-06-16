import prisma from '../../../utils/prisma'
import { withRetry } from '../../../utils/retry'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const existing = await prisma.candidate.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: '候选人不存在' })
  }

  const stageChanged = body.currentStage && body.currentStage !== existing.currentStage

  const result = await withRetry(async () => {
    return prisma.candidate.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        position: body.position,
        department: body.department,
        currentStage: body.currentStage,
        status: body.status,
        avatarUrl: body.avatarUrl,
        resumeUrl: body.resumeUrl,
        source: body.source,
        referredBy: body.referredBy,
        ...(stageChanged ? {
          stageHistory: {
            create: {
              fromStage: existing.currentStage,
              toStage: body.currentStage,
              reason: body.stageChangeReason,
              changedBy: body.changedBy || 'system'
            }
          }
        } : {})
      }
    })
  }, {
    endpoint: `/api/candidates/${id}`,
    method: 'PUT',
    requestBody: body
  })

  return result.data
})
