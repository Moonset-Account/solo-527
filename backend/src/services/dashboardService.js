import { Op } from 'sequelize'
import {
  Order,
  OrderItem,
  Tour,
  TourSchedule,
  CleaningTask,
  Reminder,
  Driver,
  User
} from '../db/models.js'
import redis from '../config/redis.js'

export const getDashboardStats = async () => {
  const cacheKey = 'dashboard:stats'
  const cached = await redis.get(cacheKey)

  if (cached) {
    return JSON.parse(cached)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalOrders,
    todayOrders,
    pendingOrders,
    todaySchedules,
    todayCleaningTasks,
    urgentReminders,
    activeDrivers,
    revenueToday,
    orderStats,
    lowInventory
  ] = await Promise.all([
    Order.count(),
    Order.count({ where: { createdAt: { [Op.gte]: today } } }),
    Order.count({ where: { status: 'pending_confirmation' } }),
    TourSchedule.count({ where: { tourDate: { [Op.eq]: today.toISOString().split('T')[0] } } }),
    CleaningTask.count({ where: { scheduledDate: today.toISOString().split('T')[0], status: 'pending' } }),
    Reminder.count({ where: { level: 'urgent', status: 'unread' } }),
    Driver.count({ where: { status: 'on_duty' } }),
    Order.sum('paidAmount', { where: { createdAt: { [Op.gte]: today } } }),
    getOrderStatusStats(),
    getLowInventorySchedules()
  ])

  const stats = {
    overview: {
      totalOrders,
      todayOrders,
      pendingOrders,
      todaySchedules,
      todayCleaningTasks,
      urgentReminders,
      activeDrivers,
      revenueToday: revenueToday || 0
    },
    orderStats,
    lowInventory: lowInventory
  }

  await redis.set(cacheKey, JSON.stringify(stats), 'EX', 60)

  return stats
}

const getOrderStatusStats = async () => {
  const statuses = await Order.findAll({
    attributes: ['status', [Order.sequelize.fn('COUNT', Order.sequelize.col('id')), 'count']],
    group: ['status'],
    raw: true
  })

  const result = {}
  statuses.forEach(s => {
    result[s.status] = parseInt(s.count)
  })

  return result
}

const getLowInventorySchedules = async () => {
  const today = new Date().toISOString().split('T')[0]

  const schedules = await TourSchedule.findAll({
    where: {
      tourDate: { [Op.gte]: today },
      status: { [Op.ne]: 'cancelled' }
    },
    include: [
      { model: Tour, as: 'tour', attributes: ['id', 'name', 'code'] }
    ],
    order: [['tourDate', 'ASC'], ['startTime', 'ASC']],
    limit: 20
  })

  return schedules
    .filter(s => s.capacity > 0 && (s.booked / s.capacity) >= 0.8)
    .map(s => ({
      id: s.id,
      tourName: s.tour?.name,
      tourCode: s.tour?.code,
      tourDate: s.tourDate,
      startTime: s.startTime,
      capacity: s.capacity,
      booked: s.booked,
      occupancyRate: Math.round((s.booked / s.capacity) * 100)
    }))
}

export const getAnomalies = async () => {
  const cacheKey = 'dashboard:anomalies'
  const cached = await redis.get(cacheKey)

  if (cached) {
    return JSON.parse(cached)
  }

  const today = new Date().toISOString().split('T')[0]

  const [
    pendingOrders,
    delayedSchedules,
    overdueCleaning,
    lowStockAlerts
  ] = await Promise.all([
    Order.findAll({
      where: { status: 'pending_confirmation' },
      include: [{ model: OrderItem, as: 'items', include: [{ model: Tour, as: 'tour', attributes: ['name'] }] }],
      order: [['createdAt', 'ASC']],
      limit: 10
    }),
    TourSchedule.findAll({
      where: {
        tourDate: today,
        status: 'in_progress'
      },
      include: [{ model: Tour, as: 'tour', attributes: ['name'] }],
      limit: 10
    }),
    CleaningTask.findAll({
      where: {
        scheduledDate: today,
        status: 'pending'
      },
      include: [{ model: User, as: 'assignee', attributes: ['name'] }],
      order: [['scheduledTime', 'ASC']],
      limit: 10
    }),
    TourSchedule.findAll({
      where: {
        tourDate: { [Op.gte]: today },
        status: { [Op.ne]: 'cancelled' }
      },
      include: [{ model: Tour, as: 'tour', attributes: ['name'] }],
      order: [['tourDate', 'ASC']],
      limit: 20
    })
  ])

  const anomalies = {
    pendingOrders: pendingOrders.map(o => ({
      id: o.id,
      orderNo: o.orderNo,
      customerName: o.customerName,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
      items: o.items?.map(i => ({ tourName: i.tour?.name }))
    })),
    overdueCleaning: overdueCleaning.map(t => ({
      id: t.id,
      taskNo: t.taskNo,
      cleaningType: t.cleaningType,
      scheduledDate: t.scheduledDate,
      scheduledTime: t.scheduledTime,
      assigneeName: t.assignee?.name,
      priority: t.priority
    })),
    lowStock: lowStockAlerts
      .filter(s => s.capacity > 0 && (s.booked / s.capacity) >= 0.9)
      .map(s => ({
        id: s.id,
        tourName: s.tour?.name,
        tourDate: s.tourDate,
        startTime: s.startTime,
        remaining: s.capacity - s.booked,
        capacity: s.capacity
      }))
  }

  await redis.set(cacheKey, JSON.stringify(anomalies), 'EX', 30)

  return anomalies
}
