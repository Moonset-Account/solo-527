import { Op } from 'sequelize'
import models from '../Models/index.js'
import redis from '../../config/redis.js'

const { Tour, TourSchedule, TourVersion, User, Driver } = models

const CACHE_TTL = 300

function generateTourCode() {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `TOUR${y}${m}${d}${rand}`
}

export async function getList(params = {}) {
  const {
    page = 1,
    pageSize = 20,
    status,
    destination,
    operatorId,
    keyword,
    startDate,
    endDate,
  } = params

  const where = {}

  if (status) {
    where.status = status
  }

  if (destination) {
    where[Op.or] = [
      { destination },
      { destination: { [Op.iLike]: `%${destination}%` } },
    ]
  }

  if (operatorId) {
    where.operatorId = operatorId
  }

  if (keyword) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword}%` } },
      { code: { [Op.iLike]: `%${keyword}%` } },
      { description: { [Op.iLike]: `%${keyword}%` } },
      { meetingPoint: { [Op.iLike]: `%${keyword}%` } },
    ]
  }

  if (startDate || endDate) {
    const scheduleWhere = {}
    if (startDate) scheduleWhere.tourDate = { [Op.gte]: startDate }
    if (endDate) scheduleWhere.tourDate = { ...(scheduleWhere.tourDate || {}), [Op.lte]: endDate }
  }

  const include = [
    { model: User, as: 'operator', attributes: ['id', 'name'] },
  ]

  const { count, rows } = await Tour.findAndCountAll({
    where,
    include,
    order: [['createdAt', 'DESC']],
    limit: Number(pageSize),
    offset: (Number(page) - 1) * Number(pageSize),
    distinct: true,
  })

  return {
    list: rows.map((r) => r.toJSON()),
    total: count,
    page: Number(page),
    pageSize: Number(pageSize),
    lastPage: Math.ceil(count / Number(pageSize)),
  }
}

export async function getDetail(tourId) {
  const tour = await Tour.findOne({
    where: { id: tourId },
    include: [
      { model: User, as: 'operator', attributes: ['id', 'name'] },
    ],
  })

  if (!tour) {
    throw new Error('路线不存在')
  }

  const versions = await TourVersion.findAll({
    where: { tourId },
    include: [
      { model: User, as: 'creator', attributes: ['id', 'name'] },
      { model: User, as: 'approver', attributes: ['id', 'name'] },
    ],
    order: [['version', 'DESC']],
  })

  const today = new Date().toISOString().slice(0, 10)
  const schedules = await TourSchedule.findAll({
    where: { tourId, tourDate: { [Op.gte]: today } },
    order: [['tourDate', 'ASC'], ['startTime', 'ASC']],
    limit: 20,
  })

  return {
    tour: tour.toJSON(),
    versions: versions.map((v) => v.toJSON()),
    schedules: schedules.map((s) => s.toJSON()),
  }
}

export async function create(data = {}, operatorId) {
  const {
    name,
    code,
    destination,
    duration,
    price,
    capacity,
    description,
    highlights,
    meetingPoint,
    status,
  } = data

  const finalCode = code || generateTourCode()

  const tour = await Tour.create({
    name,
    code: finalCode,
    destination,
    duration,
    price,
    capacity,
    description: description || null,
    highlights: highlights || [],
    meetingPoint: meetingPoint || null,
    status: status || 'draft',
    operatorId,
  })

  return getDetail(tour.id)
}

export async function update(tourId, data = {}) {
  const tour = await Tour.findByPk(tourId)

  if (!tour) {
    throw new Error('路线不存在')
  }

  const allowedFields = [
    'name',
    'code',
    'destination',
    'duration',
    'price',
    'capacity',
    'description',
    'highlights',
    'meetingPoint',
    'status',
  ]

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      tour[field] = data[field]
    }
  }

  await tour.save()

  return getDetail(tourId)
}

export async function archive(tourId) {
  const tour = await Tour.findByPk(tourId)

  if (!tour) {
    throw new Error('路线不存在')
  }

  tour.status = 'archived'
  await tour.save()

  return getDetail(tourId)
}

export async function publish(tourId) {
  const tour = await Tour.findByPk(tourId)

  if (!tour) {
    throw new Error('路线不存在')
  }

  tour.status = 'published'
  await tour.save()

  return getDetail(tourId)
}

export async function getSchedules(params = {}) {
  const {
    page = 1,
    pageSize = 20,
    tourId,
    status,
    startDate,
    endDate,
    driverId,
    keyword,
  } = params

  const where = {}

  if (tourId) where.tourId = tourId
  if (status) where.status = status
  if (startDate) where.tourDate = { [Op.gte]: startDate }
  if (endDate) where.tourDate = { ...(where.tourDate || {}), [Op.lte]: endDate }
  if (driverId) where.driverId = driverId

  const include = [
    { model: Tour, as: 'tour', attributes: ['id', 'name', 'code'] },
    { model: Driver, as: 'driver', attributes: ['id', 'name', 'phone'] },
  ]

  if (keyword) {
    include[0].where = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${keyword}%` } },
        { code: { [Op.iLike]: `%${keyword}%` } },
      ],
    }
  }

  const { count, rows } = await TourSchedule.findAndCountAll({
    where,
    include,
    order: [['tourDate', 'DESC'], ['startTime', 'DESC']],
    limit: Number(pageSize),
    offset: (Number(page) - 1) * Number(pageSize),
    distinct: true,
  })

  const list = rows.map((item) => {
    const json = item.toJSON()
    return {
      ...json,
      remaining: (item.capacity || 0) - (item.booked || 0),
    }
  })

  return {
    list,
    total: count,
    page: Number(page),
    pageSize: Number(pageSize),
    lastPage: Math.ceil(count / Number(pageSize)),
  }
}

export async function createSchedule(data = {}) {
  const {
    tourId,
    tourDate,
    startTime,
    endTime,
    capacity,
    status,
    driverId,
    vehiclePlate,
    remark,
  } = data

  if (!tourId) {
    throw new Error('缺少 tourId')
  }

  const tour = await Tour.findByPk(tourId)
  if (!tour) {
    throw new Error('路线不存在')
  }

  const schedule = await TourSchedule.create({
    tourId,
    tourDate,
    startTime,
    endTime,
    capacity: capacity || tour.capacity,
    booked: 0,
    status: status || 'scheduled',
    driverId: driverId || null,
    vehiclePlate: vehiclePlate || null,
    remark: remark || null,
  })

  return schedule.toJSON()
}

export async function updateSchedule(scheduleId, data = {}) {
  const schedule = await TourSchedule.findByPk(scheduleId)

  if (!schedule) {
    throw new Error('排期不存在')
  }

  const allowedFields = [
    'tourId',
    'tourDate',
    'startTime',
    'endTime',
    'capacity',
    'status',
    'driverId',
    'vehiclePlate',
    'remark',
  ]

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      schedule[field] = data[field]
    }
  }

  await schedule.save()

  return schedule.toJSON()
}

export async function getVersions(tourId, params = {}) {
  const { page = 1, pageSize = 20, status } = params

  const where = { tourId }
  if (status) where.status = status

  const { count, rows } = await TourVersion.findAndCountAll({
    where,
    include: [
      { model: User, as: 'creator', attributes: ['id', 'name'] },
      { model: User, as: 'approver', attributes: ['id', 'name'] },
    ],
    order: [['version', 'DESC']],
    limit: Number(pageSize),
    offset: (Number(page) - 1) * Number(pageSize),
  })

  return {
    list: rows.map((r) => r.toJSON()),
    total: count,
    page: Number(page),
    pageSize: Number(pageSize),
    lastPage: Math.ceil(count / Number(pageSize)),
  }
}

export async function createVersion(tourId, data = {}, operatorId) {
  const { title, content, changeLog } = data

  if (!tourId) {
    throw new Error('缺少 tourId')
  }

  const tour = await Tour.findByPk(tourId)
  if (!tour) {
    throw new Error('路线不存在')
  }

  const lastVersion = await TourVersion.findOne({
    where: { tourId },
    order: [['version', 'DESC']],
  })

  const nextVersion = lastVersion ? Number(lastVersion.version) + 1 : 1

  const version = await TourVersion.create({
    tourId,
    version: String(nextVersion),
    title: title || `版本 ${nextVersion}`,
    content: content || '',
    changeLog: changeLog || null,
    status: 'pending',
    createdBy: operatorId,
  })

  return version.toJSON()
}

export async function approveVersion(versionId, operatorId) {
  const version = await TourVersion.findByPk(versionId)

  if (!version) {
    throw new Error('版本不存在')
  }

  if (version.status !== 'pending') {
    throw new Error(`当前版本状态 ${version.status} 不允许审核`)
  }

  version.status = 'approved'
  version.approvedBy = operatorId
  version.approvedAt = new Date()
  await version.save()

  return version.toJSON()
}

export async function rejectVersion(versionId, operatorId) {
  const version = await TourVersion.findByPk(versionId)

  if (!version) {
    throw new Error('版本不存在')
  }

  if (version.status !== 'pending') {
    throw new Error(`当前版本状态 ${version.status} 不允许审核`)
  }

  version.status = 'rejected'
  version.approvedBy = operatorId
  version.approvedAt = new Date()
  await version.save()

  return version.toJSON()
}

export default {
  getList,
  getDetail,
  create,
  update,
  archive,
  publish,
  getSchedules,
  createSchedule,
  updateSchedule,
  getVersions,
  createVersion,
  approveVersion,
  rejectVersion,
}
