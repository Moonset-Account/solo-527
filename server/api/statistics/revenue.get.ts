import { prisma } from '~/server/utils/prisma'
import { createApiError, handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const period = (query.period as string) || 'day'
    const dateFrom = query.dateFrom ? new Date(query.dateFrom as string) : new Date(new Date().setDate(new Date().getDate() - 30))
    const dateTo = query.dateTo ? new Date(query.dateTo as string) : new Date()

    const validPeriods = ['day', 'week', 'month']
    if (!validPeriods.includes(period)) {
      return createApiError({ statusCode: 400, statusMessage: '无效的统计周期' })
    }

    const payments = await prisma.payment.findMany({
      where: {
        status: 'PAID',
        paidAt: { gte: dateFrom, lte: dateTo },
      },
      select: {
        amount: true,
        paidAt: true,
      },
      orderBy: { paidAt: 'asc' },
    })

    const grouped: Record<string, number> = {}

    for (const payment of payments) {
      if (!payment.paidAt) continue
      const date = new Date(payment.paidAt)
      let key: string

      if (period === 'day') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      } else if (period === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      grouped[key] = (grouped[key] || 0) + Number(payment.amount)
    }

    const items = Object.entries(grouped).map(([date, revenue]) => ({
      date,
      revenue,
    }))

    return { success: true, data: { items, period } }
  } catch (error) {
    handlePrismaError(error, '查询营收统计')
  }
})
