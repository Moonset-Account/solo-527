import { requireAuth } from '~/server/utils/response'
import { successResponse, errorResponse } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)

  const body = await readBody(event)
  const { orderId, riderId, reason, dispatchType } = body

  if (!orderId || !riderId) {
    return errorResponse('订单ID和骑手ID不能为空', 400)
  }

  const prisma = usePrisma()

  const order = await prisma.deliveryOrder.findUnique({
    where: { id: BigInt(orderId) },
  })

  if (!order) {
    return errorResponse('订单不存在', 404)
  }

  const rider = await prisma.rider.findUnique({
    where: { id: BigInt(riderId) },
  })

  if (!rider) {
    return errorResponse('骑手不存在', 404)
  }

  const previousRiderId = order.riderId

  const result = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.deliveryOrder.update({
      where: { id: BigInt(orderId) },
      data: {
        riderId: BigInt(riderId),
        status: 'ASSIGNED',
        dispatcherId: BigInt(auth.userId),
      },
    })

    const dispatchRecord = await tx.dispatchRecord.create({
      data: {
        orderId: BigInt(orderId),
        riderId: BigInt(riderId),
        dispatcherId: BigInt(auth.userId),
        dispatchType: dispatchType || (previousRiderId ? 'REASSIGN' : 'MANUAL'),
        previousRiderId: previousRiderId || undefined,
        reason: reason || (previousRiderId ? '改派骑手' : '手动分派'),
      },
    })

    await tx.orderTimeline.create({
      data: {
        orderId: BigInt(orderId),
        fromStatus: order.status,
        toStatus: 'ASSIGNED',
        eventType: previousRiderId ? 'REASSIGN' : 'ASSIGN',
        operatorId: BigInt(auth.userId),
        operatorType: 'USER',
        remark: previousRiderId ? `改派骑手：${rider.realName}` : `分派骑手：${rider.realName}`,
      },
    })

    const view = await tx.processingView.findUnique({
      where: {
        bizType_bizId: {
          bizType: 'DELIVERY_ORDER',
          bizId: BigInt(orderId),
        },
      },
    })

    if (view) {
      await tx.processingView.update({
        where: { id: view.id },
        data: {
          status: 'ASSIGNED',
          currentHandlerId: BigInt(riderId),
          currentHandlerName: rider.realName,
          lastProcessedAt: new Date(),
          lastProcessedBy: BigInt(auth.userId),
          lastRemark: previousRiderId ? `改派骑手：${rider.realName}` : `分派骑手：${rider.realName}`,
          assignmentCount: { increment: 1 },
        },
      })

      await tx.processingNote.create({
        data: {
          viewId: view.id,
          operatorId: BigInt(auth.userId),
          operatorName: auth.realName || auth.username,
          actionType: 'ASSIGN',
          fromStatus: order.status,
          toStatus: 'ASSIGNED',
          remark: previousRiderId ? `改派骑手：${rider.realName}` : `分派骑手：${rider.realName}`,
          metaJson: { riderId, riderName: rider.realName },
        },
      })
    }

    return { order: updatedOrder, dispatchRecord }
  })

  return successResponse(result, previousRiderId ? '改派成功' : '分派成功')
})
