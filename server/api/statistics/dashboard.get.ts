import { prisma } from '~/server/utils/prisma'
import { redis } from '~/server/utils/redis'
import { handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const cached = await redis.get('dashboard:stats')
    if (cached) {
      return { success: true, data: JSON.parse(cached) }
    }

    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const [todayAppointments, todayPayments, completedAppointments, alerts, pendingTasks] = await Promise.all([
      prisma.appointment.count({
        where: { scheduledAt: { gte: startOfDay, lt: endOfDay } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'PAID',
          paidAt: { gte: startOfDay, lt: endOfDay },
        },
      }),
      prisma.appointment.count({
        where: {
          scheduledAt: { gte: startOfDay, lt: endOfDay },
          status: 'COMPLETED',
        },
      }),
      prisma.conversionAlert.findMany({
        where: { resolved: false },
      }),
      prisma.task.count({
        where: { status: 'PENDING' },
      }),
    ])

    const totalToday = todayAppointments || 0
    const completedToday = completedAppointments || 0
    const conversionRate = totalToday > 0 ? Number(((completedToday / totalToday) * 100).toFixed(2)) : 0

    const data = {
      todayAppointments: totalToday,
      todayRevenue: Number(todayPayments._sum.amount || 0),
      todayFootTraffic: totalToday,
      conversionRate,
      hasAlert: alerts.length > 0,
      alerts,
      pendingTasks,
    }

    await redis.set('dashboard:stats', JSON.stringify(data), 'EX', 60)

    return { success: true, data }
  } catch (error) {
    handlePrismaError(error, '查询仪表盘统计')
  }
})
