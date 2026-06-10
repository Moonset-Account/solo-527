import { requireAuth } from '~/server/utils/response'
import { successResponse } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const prisma = usePrisma()

  const stats = await Promise.all([
    prisma.deliveryOrder.count(),
    prisma.deliveryOrder.count({ where: { status: 'PENDING_ACCEPT' } }),
    prisma.deliveryOrder.count({ where: { status: 'IN_TRANSIT' } }),
    prisma.deliveryOrder.count({ where: { status: 'DELIVERED' } }),
    prisma.deliveryOrder.count({ where: { status: 'EXCEPTION' } }),
    prisma.temperatureAlert.count({ where: { status: 'OPEN' } }),
    prisma.claimOrder.count({ where: { status: 'SUBMITTED' } }),
    prisma.apiExceptionLog.count({ where: { status: 'NEW' } }),
    prisma.rider.count({ where: { status: 'ONLINE' } }),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayStats = await Promise.all([
    prisma.deliveryOrder.count({ where: { createdAt: { gte: today } } }),
    prisma.deliveryOrder.count({ where: { actualDeliveredAt: { gte: today } } }),
  ])

  return successResponse({
    totalOrders: stats[0],
    pendingOrders: stats[1],
    inTransitOrders: stats[2],
    deliveredOrders: stats[3],
    exceptionOrders: stats[4],
    openAlerts: stats[5],
    pendingClaims: stats[6],
    newExceptions: stats[7],
    onlineRiders: stats[8],
    todayNewOrders: todayStats[0],
    todayDelivered: todayStats[1],
  })
})
