import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'
import { redis } from '~/server/utils/redis'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const inspectionId = getRouterParam(event, 'id')
  const body = await readBody(event)

  const { conclusion, remark, beforePhotos, afterPhotos } = body

  if (!conclusion) {
    throw createError({
      statusCode: 400,
      statusMessage: '请填写验收结论',
    })
  }

  const feedback = await prisma.inspectionFeedback.create({
    data: {
      inspectionId,
      conclusion,
      remark: remark || null,
      confirmedBy: user.id,
      beforePhotos: beforePhotos || [],
      afterPhotos: afterPhotos || [],
    },
    include: {
      confirmer: { select: { name: true } },
    },
  })

  const inspectionStatus = conclusion === 'pass' ? 'completed' : 'rectifying'

  await prisma.inspection.update({
    where: { id: inspectionId },
    data: {
      status: inspectionStatus,
      completedAt: conclusion === 'pass' ? new Date() : null,
    },
  })

  await redis.del(`inspection:${inspectionId}`)

  return {
    ...feedback,
    confirmerName: feedback.confirmer.name,
  }
})
