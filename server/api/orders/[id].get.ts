import { requireAuth } from '~/server/utils/response'
import { successResponse } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const { id } = getRouterParams(event)
  const prisma = usePrisma()

  const order = await prisma.deliveryOrder.findUnique({
    where: { id: BigInt(id) },
    include: {
      customer: true,
      rider: { select: { riderNo: true, realName: true, phone: true, vehicleType: true, status: true } },
      dispatcher: { select: { username: true, realName: true } },
      timelines: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { username: true, realName: true } },
          rider: { select: { riderNo: true, realName: true } },
        },
      },
      dispatchRecords: {
        orderBy: { createdAt: 'desc' },
        include: {
          rider: { select: { riderNo: true, realName: true, phone: true } },
          previousRider: { select: { riderNo: true, realName: true } },
          dispatcher: { select: { username: true, realName: true } },
        },
      },
      routePlans: {
        orderBy: { version: 'desc' },
        include: {
          creator: { select: { username: true, realName: true } },
        },
      },
      tempRecords: {
        orderBy: { collectedAt: 'desc' },
        take: 20,
      },
      tempAlerts: {
        orderBy: { createdAt: 'desc' },
      },
      claims: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: '订单不存在',
    })
  }

  return successResponse(order)
})
