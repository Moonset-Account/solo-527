import { prisma } from '~/server/utils/prisma'
import { invalidateCache } from '~/server/utils/redis'
import { useMockStore, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  if (!(await isDbAvailable())) {
    const store = useMockStore()
    return store.refundOrder(id, body?.reason || body?.refundReason || '')
  }

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) {
    throw createError({ statusCode: 404, message: 'Order not found' })
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: 'REFUNDING',
      refundReason: body?.reason || body?.refundReason || null,
    },
  })

  await prisma.todoItem.create({
    data: {
      type: 'REFUND_APPROVAL',
      title: `退款审批: ${order.orderNo}`,
      description: body?.reason || body?.refundReason || null,
      priority: 'P1',
      status: 'PENDING',
      assigneeId: 1,
      relatedId: id,
      relatedType: 'ORDER',
    },
  })

  await invalidateCache('api:orders:*')
  await invalidateCache('api:todos:*')

  return updated
})
