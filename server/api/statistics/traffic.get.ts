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

    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: dateFrom, lte: dateTo },
      },
      select: {
        customerPhone: true,
        scheduledAt: true,
        createdAt: true,
      },
      orderBy: { scheduledAt: 'asc' },
    })

    const allCustomerPhones = await prisma.appointment.findMany({
      where: {
        scheduledAt: { lt: dateFrom },
      },
      select: {
        customerPhone: true,
      },
    })
    const existingPhones = new Set(allCustomerPhones.map((a) => a.customerPhone).filter(Boolean))

    const grouped: Record<string, { total: number; newCustomers: number; returningCustomers: number }> = {}

    for (const appointment of appointments) {
      const date = new Date(appointment.scheduledAt)
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

      if (!grouped[key]) {
        grouped[key] = { total: 0, newCustomers: 0, returningCustomers: 0 }
      }

      grouped[key].total++
      if (appointment.customerPhone && existingPhones.has(appointment.customerPhone)) {
        grouped[key].returningCustomers++
      } else {
        grouped[key].newCustomers++
      }
    }

    const items = Object.entries(grouped).map(([date, counts]) => ({
      date,
      ...counts,
    }))

    return { success: true, data: { items, period } }
  } catch (error) {
    handlePrismaError(error, '查询客流统计')
  }
})
