import { prisma } from '~/server/utils/prisma'
import { getCached } from '~/server/utils/redis'
import { useMockStore, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async () => {
  if (!(await isDbAvailable())) {
    const store = useMockStore()
    return store.getDashboardStats()
  }

  return getCached('stats:dashboard', async () => {
    const totalRooms = await prisma.room.count()
    const availableRooms = await prisma.room.count({ where: { status: 'AVAILABLE' } })
    const occupancyRate = totalRooms > 0 ? availableRooms / totalRooms : 0
    const pendingTodos = await prisma.todoItem.count({ where: { status: 'PENDING' } })
    const p0Reminders = await prisma.reminder.count({ where: { priority: 'P0', isRead: false } })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayCheckIns = await prisma.order.count({
      where: { checkIn: { gte: today, lt: tomorrow } },
    })
    const todayCheckOuts = await prisma.order.count({
      where: { checkOut: { gte: today, lt: tomorrow } },
    })

    const vacancyTrend = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today)
      day.setDate(day.getDate() - i)
      const nextDay = new Date(day)
      nextDay.setDate(nextDay.getDate() + 1)
      const dayAvailable = await prisma.room.count({ where: { status: 'AVAILABLE' } })
      const rate = totalRooms > 0 ? dayAvailable / totalRooms : 0
      vacancyTrend.push({
        date: day.toISOString().slice(0, 10),
        rate,
      })
    }

    return {
      totalRooms,
      availableRooms,
      occupancyRate,
      pendingTodos,
      p0Reminders,
      todayCheckIns,
      todayCheckOuts,
      vacancyTrend,
    }
  }, 30)
})
