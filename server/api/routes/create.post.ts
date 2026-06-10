import { requireAuth } from '~/server/utils/response'
import { successResponse, errorResponse } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)

  const body = await readBody(event)
  const { orderId, waypointsJson, totalDistanceMeters, totalMinutes, remark } = body

  if (!orderId || !waypointsJson) {
    return errorResponse('订单ID和路线数据不能为空', 400)
  }

  const prisma = usePrisma()

  const order = await prisma.deliveryOrder.findUnique({
    where: { id: BigInt(orderId) },
  })

  if (!order) {
    return errorResponse('订单不存在', 404)
  }

  const lastPlan = await prisma.routePlan.findFirst({
    where: { orderId: BigInt(orderId) },
    orderBy: { version: 'desc' },
  })

  const newVersion = lastPlan ? lastPlan.version + 1 : 1

  const result = await prisma.$transaction(async (tx) => {
    if (lastPlan) {
      await tx.routePlan.update({
        where: { id: lastPlan.id },
        data: { isActive: false },
      })
    }

    const newPlan = await tx.routePlan.create({
      data: {
        orderId: BigInt(orderId),
        version: newVersion,
        waypointsJson,
        totalDistanceMeters: totalDistanceMeters || undefined,
        totalMinutes: totalMinutes || undefined,
        optimizedBy: 'MANUAL',
        createdBy: BigInt(auth.userId),
        remark: remark || '手动调整路线',
        isActive: true,
      },
    })

    await tx.orderTimeline.create({
      data: {
        orderId: BigInt(orderId),
        eventType: 'ROUTE_CHANGE',
        operatorId: BigInt(auth.userId),
        operatorType: 'USER',
        remark: `路线调整 V${newVersion}：${remark || '手动调整路线'}`,
      },
    })

    return newPlan
  })

  return successResponse(result, '路线规划已更新')
})
