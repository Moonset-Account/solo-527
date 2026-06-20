import { Op } from 'sequelize'
import { CleaningTask, TourSchedule, Tour, User } from '../db/models.js'

const generateTaskNo = () => {
  const date = new Date()
  const prefix = 'CT' + date.getFullYear().toString().slice(-2) +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return prefix + random
}

export const getCleaningTasks = async (params = {}) => {
  const {
    page = 1,
    pageSize = 20,
    keyword,
    status,
    priority,
    assigneeId,
    startDate,
    endDate,
    cleaningType
  } = params

  const where = {}

  if (keyword) {
    where[Op.or] = [
      { taskNo: { [Op.iLike]: `%${keyword}%` } },
      { location: { [Op.iLike]: `%${keyword}%` } },
      { vehiclePlate: { [Op.iLike]: `%${keyword}%` } }
    ]
  }

  if (status) {
    where.status = status
  }

  if (priority) {
    where.priority = priority
  }

  if (assigneeId) {
    where.assigneeId = assigneeId
  }

  if (cleaningType) {
    where.cleaningType = cleaningType
  }

  if (startDate) {
    where.scheduledDate = { ...where.scheduledDate, [Op.gte]: startDate }
  }

  if (endDate) {
    where.scheduledDate = { ...where.scheduledDate, [Op.lte]: endDate }
  }

  const { count, rows } = await CleaningTask.findAndCountAll({
    where,
    include: [
      { model: User, as: 'assignee', attributes: ['id', 'name'] },
      { model: TourSchedule, as: 'schedule', attributes: ['id', 'tourDate'], include: [{ model: Tour, as: 'tour', attributes: ['name'] }] }
    ],
    order: [
      [{ priority: 'DESC' }],
      ['scheduledDate', 'ASC'],
      ['scheduledTime', 'ASC']
    ],
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

export const getCleaningTaskById = async (id) => {
  const task = await CleaningTask.findByPk(id, {
    include: [
      { model: User, as: 'assignee', attributes: ['id', 'name', 'phone'] },
      { model: TourSchedule, as: 'schedule', include: [{ model: Tour, as: 'tour' }] }
    ]
  })
  return task
}

export const createCleaningTask = async (data) => {
  const taskNo = generateTaskNo()
  const task = await CleaningTask.create({
    ...data,
    taskNo
  })
  return task
}

export const updateCleaningTask = async (id, data) => {
  const task = await CleaningTask.findByPk(id)
  if (!task) {
    throw new Error('清洁任务不存在')
  }

  if (data.status === 'in_progress' && task.status === 'pending') {
    data.startedAt = new Date()
  }

  if (data.status === 'completed' && task.status !== 'completed') {
    data.completedAt = new Date()
  }

  await task.update(data)
  return task
}

export const deleteCleaningTask = async (id) => {
  const task = await CleaningTask.findByPk(id)
  if (!task) {
    throw new Error('清洁任务不存在')
  }

  await task.update({ status: 'cancelled' })
  return true
}
