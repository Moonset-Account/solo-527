import { requireAuth } from '~/server/utils/response'
import { successResponse, errorResponse } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)

  const { id } = getRouterParams(event)
  const prisma = usePrisma()

  const order = await prisma.deliveryOrder.findUnique({
    where: { id: BigInt(id) },
  })

  if (!order) {
    return errorResponse('订单不存在', 404)
  }

  if (order.status !== 'PENDING_ACCEPT') {
    return errorResponse('订单状态不支持接单', 400)
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.deliveryOrder.update({
      where: { id: BigInt(id) },
      data: {
        status: 'ACCEPTED',
        dispatcherId: BigInt(auth.userId),
      },
    })

    await tx.orderTimeline.create({
      data: {
        orderId: BigInt(id),
        fromStatus: 'PENDING_ACCEPT',
        toStatus: 'ACCEPTED',
        eventType: 'ACCEPT',
        userId: BigInt(auth.userId),
        operatorType: 'USER',
        remark: '调度员确认接单',
      },
    })

    const view = await tx.processingView.findUnique({
      where: {
        bizType_bizId: {
          bizType: 'DELIVERY_ORDER',
          bizId: BigInt(id),
        },
      },
    })

    if (view) {
      await tx.processingView.update({
        where: { id: view.id },
        data: {
          status: 'ACCEPTED',
          lastProcessedAt: new Date(),
          lastProcessedBy: BigInt(auth.userId),
          lastRemark: '调度员已接单',
        },
      })

      await tx.processingNote.create({
        data: {
          viewId: view.id,
          operatorId: BigInt(auth.userId),
          operatorName: auth.realName || auth.username,
          actionType: 'STATUS_CHANGE',
          fromStatus: 'PENDING_ACCEPT',
          toStatus: 'ACCEPTED',
          remark: '调度员确认接单',
        },
      })
    }

    return updatedOrder
  })

  return successResponse(result, '接单成功')
})
