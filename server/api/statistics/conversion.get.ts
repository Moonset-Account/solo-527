import { prisma } from '~/server/utils/prisma'
import { handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const dateFrom = query.dateFrom ? new Date(query.dateFrom as string) : new Date(new Date().setDate(new Date().getDate() - 30))
    const dateTo = query.dateTo ? new Date(query.dateTo as string) : new Date()

    const dailyAppointments = await prisma.appointment.groupBy({
      by: ['scheduledAt'],
      where: {
        scheduledAt: { gte: dateFrom, lte: dateTo },
      },
      _count: { id: true },
    })

    const dailyCompleted = await prisma.appointment.groupBy({
      by: ['scheduledAt'],
      where: {
        scheduledAt: { gte: dateFrom, lte: dateTo },
        status: 'COMPLETED',
      },
      _count: { id: true },
    })

    const grouped: Record<string, { total: number; completed: number }> = {}

    for (const item of dailyAppointments) {
      const date = new Date(item.scheduledAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      if (!grouped[key]) grouped[key] = { total: 0, completed: 0 }
      grouped[key].total += item._count.id
    }

    for (const item of dailyCompleted) {
      const date = new Date(item.scheduledAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      if (grouped[key]) grouped[key].completed += item._count.id
    }

    const items = Object.entries(grouped)
      .map(([date, counts]) => ({
        date,
        total: counts.total,
        completed: counts.completed,
        conversionRate: counts.total > 0 ? Number(((counts.completed / counts.total) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const threshold = 60

    return { success: true, data: { items, threshold } }
  } catch (error) {
    handlePrismaError(error, '查询转化率统计')
  }
})
