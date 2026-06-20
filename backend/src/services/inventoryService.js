import { Op } from 'sequelize'
import { TourSchedule, Tour, InventoryLog, Order, Driver } from '../db/models.js'
import redis from '../config/redis.js'

export const getInventorySummary = async (params = {}) => {
  const { startDate, endDate, tourId } = params

  const cacheKey = `inventory:summary:${startDate || 'all'}:${endDate || 'all'}:${tourId || 'all'}`
  const cached = await redis.get(cacheKey)

  if (cached) {
    return JSON.parse(cached)
  }

  const scheduleWhere = {}
  if (startDate) {
    scheduleWhere.tourDate = { ...scheduleWhere.tourDate, [Op.gte]: startDate }
  }
  if (endDate) {
    scheduleWhere.tourDate = { ...scheduleWhere.tourDate, [Op.lte]: endDate }
  }
  if (tourId) {
    scheduleWhere.tourId = tourId
  }

  const schedules = await TourSchedule.findAll({
    where: scheduleWhere,
    include: [
      { model: Tour, as: 'tour', attributes: ['id', 'name', 'code'] }
    ],
    order: [['tourDate', 'ASC'], ['startTime', 'ASC']]
  })

  const result = schedules.map(schedule => ({
    id: schedule.id,
    tourId: schedule.tourId,
    tourName: schedule.tour?.name,
    tourCode: schedule.tour?.code,
    tourDate: schedule.tourDate,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    capacity: schedule.capacity,
    booked: schedule.booked,
    available: schedule.capacity - schedule.booked,
    status: schedule.status,
    occupancyRate: schedule.capacity > 0 ? Math.round((schedule.booked / schedule.capacity) * 100) : 0
  }))

  await redis.set(cacheKey, JSON.stringify(result), 'EX', 60)

  return result
}

export const getInventoryDetail = async (scheduleId) => {
  const schedule = await TourSchedule.findByPk(scheduleId, {
    include: [
      { model: Tour, as: 'tour', attributes: ['id', 'name', 'code', 'price'] },
      { model: Driver, as: 'driver', attributes: ['id', 'name', 'phone'] }
    ]
  })

  if (!schedule) {
    throw new Error('排期不存在')
  }

  const logs = await InventoryLog.findAll({
    where: { scheduleId },
    include: [
      { model: Order, as: 'order', attributes: ['id', 'orderNo'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: 100
  })

  return {
    schedule: {
      id: schedule.id,
      tourId: schedule.tourId,
      tourName: schedule.tour?.name,
      tourCode: schedule.tour?.code,
      tourDate: schedule.tourDate,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      capacity: schedule.capacity,
      booked: schedule.booked,
      available: schedule.capacity - schedule.booked,
      status: schedule.status,
      driver: schedule.driver,
      remark: schedule.remark
    },
    logs
  }
}

export const getInventoryLogs = async (params = {}) => {
  const {
    page = 1,
    pageSize = 20,
    scheduleId,
    orderId,
    changeType,
    startDate,
    endDate
  } = params

  const where = {}

  if (scheduleId) {
    where.scheduleId = scheduleId
  }

  if (orderId) {
    where.orderId = orderId
  }

  if (changeType) {
    where.changeType = changeType
  }

  if (startDate) {
    where.createdAt = { ...where.createdAt, [Op.gte]: new Date(startDate) }
  }

  if (endDate) {
    where.createdAt = { ...where.createdAt, [Op.lte]: new Date(endDate + ' 23:59:59') }
  }

  const { count, rows } = await InventoryLog.findAndCountAll({
    where,
    include: [
      { model: Order, as: 'order', attributes: ['id', 'orderNo'] },
      { model: TourSchedule, as: 'schedule', attributes: ['id', 'tourDate'], include: [{ model: Tour, as: 'tour', attributes: ['name'] }] }
    ],
    order: [['createdAt', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize
  })

  return {
    list: rows,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  }
}

export const adjustInventory = async (scheduleId, quantity, remark, userId) => {
  const schedule = await TourSchedule.findByPk(scheduleId)
  if (!schedule) {
    throw new Error('排期不存在')
  }

  const beforeQty = schedule.booked
  const afterQty = Math.max(0, Math.min(schedule.capacity, schedule.booked + quantity))
  const actualChange = afterQty - beforeQty

  if (actualChange === 0) {
    return schedule
  }

  await schedule.update({ booked: afterQty })

  await InventoryLog.create({
    scheduleId,
    changeType: 'adjust',
    quantityChange: actualChange,
    beforeQuantity: beforeQty,
    afterQuantity: afterQty,
    operatorId: userId,
    remark: remark || '手动调整库存'
  })

  await redis.del(`inventory:summary:*`)

  return schedule
}
