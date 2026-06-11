import { prisma } from '~/server/utils/prisma'
import { mockOrders, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!(await isDbAvailable())) {
    const order = mockOrders.find(o => o.id === id)
    if (!order) {
      throw createError({ statusCode: 404, message: 'Order not found' })
    }
    return order
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true, room: true },
  })

  if (!order) {
    throw createError({ statusCode: 404, message: 'Order not found' })
  }

  return order
})
