import { Op } from 'sequelize'
import { Tour, TourSchedule, TourVersion, User, Driver } from '../db/models.js'
import redis from '../config/redis.js'

const CACHE_TTL = 300

export const getTours = async (params = {}) => {
  const {
    page = 1,
    pageSize = 20,
    keyword,
    status,
    destination,
    operatorId,
    startDate,
    endDate
  } = params

  const where = {}

  if (keyword) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword}%` } },
      { code: { [Op.iLike]: `%${keyword}%` } },
      { description: { [Op.iLike]: `%${keyword}%` } }
    ]
  }

  if (status) {
    where.status = status
  }

  if (destination) {
    where.destination = { [Op.iLike]: `%${destination}%` }
  }

  if (operatorId) {
    where.operatorId = operatorId
  }

  const { count, rows } = await Tour.findAndCountAll({
    where,
    include: [
      { model: User, as: 'operator', attributes: ['id', 'name'] }
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

export const getTourById = async (id) => {
  const cacheKey = `tour:${id}`
  const cached = await redis.get(cacheKey)

  if (cached) {
    return JSON.parse(cached)
  }

  const tour = await Tour.findByPk(id, {
    include: [
      { model: User, as: 'operator', attributes: ['id', 'name'] },
      { model: TourVersion, as: 'versions', limit: 10, order: [['createdAt', 'DESC']] }
    ]
  })

  if (tour) {
    await redis.set(cacheKey, JSON.stringify(tour), 'EX', CACHE_TTL)
  }

  return tour
}

export const createTour = async (data, userId) => {
  const tour = await Tour.create({
    ...data,
    operatorId: data.operatorId || userId
  })

  await TourVersion.create({
    tourId: tour.id,
    version: '1.0',
    content: JSON.stringify(data),
    changeLog: '初始版本',
    status: 'approved',
    createdBy: userId
  })

  await redis.del(`tour:list`)

  return tour
}

export const updateTour = async (id, data, userId) => {
  const tour = await Tour.findByPk(id)
  if (!tour) {
    throw new Error('导览路线不存在')
  }

  const oldVersion = JSON.stringify(tour.toJSON())

  await tour.update(data)

  const versions = await TourVersion.count({ where: { tourId: id } })
  await TourVersion.create({
    tourId: id,
    version: `${versions + 1}.0`,
    content: JSON.stringify(data),
    changeLog: data.changeLog || '更新路线信息',
    status: 'pending',
    createdBy: userId
  })

  await redis.del(`tour:${id}`)
  await redis.del(`tour:list`)

  return tour
}

export const deleteTour = async (id) => {
  const tour = await Tour.findByPk(id)
  if (!tour) {
    throw new Error('导览路线不存在')
  }

  await tour.update({ status: 'archived' })

  await redis.del(`tour:${id}`)
  await redis.del(`tour:list`)

  return true
}

export const getTourSchedules = async (params = {}) => {
  const {
    page = 1,
    pageSize = 20,
    tourId,
    startDate,
    endDate,
    status,
    driverId
  } = params

  const where = {}

  if (tourId) {
    where.tourId = tourId
  }

  if (startDate) {
    where.tourDate = { ...where.tourDate, [Op.gte]: startDate }
  }

  if (endDate) {
    where.tourDate = { ...where.tourDate, [Op.lte]: endDate }
  }

  if (status) {
    where.status = status
  }

  if (driverId) {
    where.driverId = driverId
  }

  const { count, rows } = await TourSchedule.findAndCountAll({
    where,
    include: [
      { model: Tour, as: 'tour', attributes: ['id', 'name', 'code'] },
      { model: Driver, as: 'driver', attributes: ['id', 'name', 'phone'] }
    ],
    order: [['tourDate', 'ASC'], ['startTime', 'ASC']],
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

export const createSchedule = async (data) => {
  const schedule = await TourSchedule.create(data)
  return schedule
}

export const updateSchedule = async (id, data) => {
  const schedule = await TourSchedule.findByPk(id)
  if (!schedule) {
    throw new Error('排期不存在')
  }

  await schedule.update(data)
  return schedule
}
