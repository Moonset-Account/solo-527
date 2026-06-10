import { requireAuth } from '~/server/utils/response'
import { successResponse } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const { id } = getRouterParams(event)
  const prisma = usePrisma()

  const report = await prisma.temperatureSafetyReport.findUnique({
    where: { id: BigInt(id) },
    include: {
      customer: true,
      order: true,
      handler: { select: { username: true, realName: true, phone: true } },
      confirmer: { select: { username: true, realName: true } },
    },
  })

  if (!report) {
    throw createError({
      statusCode: 404,
      statusMessage: '报表不存在',
    })
  }

  return successResponse(report)
})
