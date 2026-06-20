import { Op, fn, col } from 'sequelize'
import models from '../Models/index.js'
import redis from '../../config/redis.js'

const {
  Order,
  TourSchedule,
  CleaningTask,
  Reminder,
  Driver,
  Tour,
} = models

export async function getStats() {
  const cacheKey = 'dashboard:stats'
  const cached = await redis.get(cacheKey)

  if (cached) {
    return JSON.parse(cached)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const [
    totalOrders,
    todayOrders,
    pendingOrders,
    todaySchedules,
    todayCleaningTasks,
    urgentReminders,
    activeDrivers,
    revenueToday,
    orderStatsRaw,
    lowInventoryRaw,
  ] = await Promise.all([
    Order.count(),
    Order.count({ where: { createdAt: { [Op.gte]: today, [Op.lte]: todayEnd } } }),
    Order.count({ where: { status: 'pending_confirmation' } }),
    TourSchedule.count({ where: { tourDate: todayStr, status: { [Op.ne]: 'cancelled' } } }),
    CleaningTask.count({ where: { scheduledDate: todayStr } }),
    Reminder.count({ where: { level: 'urgent', status: 'unread' } }),
    Driver.count({ where: { status: 'active' } }),
    Order.sum('paidAmount', { where: { createdAt: { [Op.gte]: today, [Op.lte]: todayEnd } } }),
    Order.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }),
    TourSchedule.findAll({
      where: {
        tourDate: { [Op.gte]: todayStr },
        status: { [Op.in]: ['scheduled', 'confirmed'] },
      },
      include: [
        { model: Tour, as: 'tour', attributes: ['id', 'name', 'code'] },
      ],
      order: [['tourDate', 'ASC'], ['startTime', 'ASC']],
      limit: 50,
    }),
  ])

  const orderStats = {
    pending_confirmation: 0,
    confirmed: 0,
    completed: 0,
    refunded: 0,
  }

  for (const row of orderStatsRaw) {
    if (row.status in orderStats) {
      orderStats[row.status] = Number(row.count) || 0
    }
  }

  const lowInventory = lowInventoryRaw
    .filter((s) => s.capacity > 0 && s.booked / s.capacity >= 0.8)
    .map((s) => ({
      id: s.id,
      tourId: s.tourId,
      tourDate: s.tourDate,
      startTime: s.startTime,
      capacity: s.capacity,
      booked: s.booked,
      status: s.status,
      tourName: s.tour?.name,
      tourCode: s.tour?.code,
      remaining: s.capacity - s.booked,
      occupancyRate: s.capacity > 0 ? Math.round((s.booked / s.capacity) * 10000) / 100 : 0,
    }))

  const stats = {
    overview: {
      totalOrders,
      todayOrders,
      pendingOrders,
      todaySchedules,
      todayCleaningTasks,
      urgentReminders,
      activeDrivers,
      revenueToday: Number(revenueToday) || 0,
    },
    orderStats,
    lowInventory,
  }

  await redis.set(cacheKey, JSON.stringify(stats), 'EX', 60)

  return stats
}

export async function getExceptions() {
  const cacheKey = 'dashboard:anomalies'
  const cached = await redis.get(cacheKey)

  if (cached) {
    return JSON.parse(cached)
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const [
    pendingConfirmOrders,
    overdueCleaningTasks,
    lowInventoryItems,
    urgentUnreadReminders,
  ] = await Promise.all([
    Order.findAll({
      where: { status: 'pending_confirmation' },
      order: [['createdAt', 'ASC']],
      limit: 10,
    }),
    CleaningTask.findAll({
      where: { scheduledDate: { [Op.lt]: todayStr }, status: 'pending' },
      order: [['scheduledDate', 'ASC']],
      limit: 50,
    }),
    TourSchedule.findAll({
      where: {
        tourDate: { [Op.gte]: todayStr },
        status: { [Op.in]: ['scheduled', 'confirmed'] },
      },
      include: [
        { model: Tour, as: 'tour', attributes: ['id', 'name', 'code'] },
      ],
      order: [['tourDate', 'ASC']],
      limit: 50,
    }),
    Reminder.findAll({
      where: { level: 'urgent', status: 'unread' },
      order: [['createdAt', 'DESC']],
      limit: 50,
    }),
  ])

  const lowInventoryWithRates = lowInventoryItems
    .filter((s) => s.capacity > 0 && s.booked / s.capacity >= 0.8)
    .map((s) => ({
      id: s.id,
      tourId: s.tourId,
      tourDate: s.tourDate,
      startTime: s.startTime,
      capacity: s.capacity,
      booked: s.booked,
      status: s.status,
      tourName: s.tour?.name,
      tourCode: s.tour?.code,
      remaining: s.capacity - s.booked,
      occupancyRate: s.capacity > 0 ? Math.round((s.booked / s.capacity) * 10000) / 100 : 0,
    }))

  const result = {
    pendingConfirmOrders: pendingConfirmOrders.map((o) => o.toJSON()),
    overdueCleaningTasks: overdueCleaningTasks.map((t) => t.toJSON()),
    lowInventoryItems: lowInventoryWithRates,
    urgentUnreadReminders: urgentUnreadReminders.map((r) => r.toJSON()),
  }

  await redis.set(cacheKey, JSON.stringify(result), 'EX', 30)

  return result
}

export default {
  getStats,
  getExceptions,
}
