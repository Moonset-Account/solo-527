import { requireAuth } from '~/server/utils/response'
import { successResponse } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const { id } = getRouterParams(event)
  const prisma = usePrisma()

  const claim = await prisma.claimOrder.findUnique({
    where: { id: BigInt(id) },
    include: {
      order: true,
      tempAlert: {
        include: {
          record: true,
        },
      },
      applicant: { select: { username: true, realName: true, phone: true } },
      reviewer: { select: { username: true, realName: true } },
      approver: { select: { username: true, realName: true } },
    },
  })

  if (!claim) {
    throw createError({
      statusCode: 404,
      statusMessage: '赔付工单不存在',
    })
  }

  return successResponse(claim)
})
