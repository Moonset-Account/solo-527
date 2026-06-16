import prisma from '../../../utils/prisma'
import { withRetry } from '../../../utils/retry'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = await withRetry(async () => {
    return prisma.candidate.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        position: body.position,
        department: body.department,
        currentStage: body.currentStage || 'SCREENING',
        status: body.status || 'ACTIVE',
        avatarUrl: body.avatarUrl,
        resumeUrl: body.resumeUrl,
        source: body.source,
        referredBy: body.referredBy,
        stageHistory: {
          create: {
            toStage: body.currentStage || 'SCREENING',
            reason: '候选人创建',
            changedBy: body.createdBy || 'system'
          }
        }
      }
    })
  }, {
    endpoint: '/api/candidates',
    method: 'POST',
    requestBody: body
  })

  if (!result.data) {
    throw createError({ statusCode: 500, statusMessage: '创建候选人失败，请查看重试日志' })
  }

  return result.data
})
