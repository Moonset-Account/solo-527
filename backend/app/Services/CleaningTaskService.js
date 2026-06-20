import { Op } from 'sequelize'
import models from '../Models/index.js'

const { CleaningTask, User, TourSchedule, Tour } = models

function generateTaskNo() {
  const date = new Date()
  const prefix = 'CT' +
    date.getFullYear().toString().slice(-2) +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return prefix + random
}

export async function getList(params = {}) {
  const {
    page = 1,
    pageSize = 20,
    status,
    priority,
    cleaningType,
    assigneeId,
    startDate,
    endDate,
    keyword,
  } = params

  const where = {}

  if (status) where.status = status
  if (priority) where.priority = priority
  if (cleaningType) where.cleaningType = cleaningType
  if (assigneeId) where.assigneeId = assigneeId

  if (startDate) where.scheduledDate = { [Op.gte]: startDate }
  if (endDate) where.scheduledDate = { ...(where.scheduledDate || {}), [Op.lte]: endDate }

  if (keyword) {
    where[Op.or] = [
      { taskNo: { [Op.iLike]: `%${keyword}%` } },
      { title: { [Op.iLike]: `%${keyword}%` } },
    ]
  }

  const include = [
    { model: User, as: 'assignee', attributes: ['id', 'name'] },
  ]

  const { count, rows } = await CleaningTask.findAndCountAll({
    where,
    include,
    order: [['scheduledDate', 'DESC'], ['scheduledTime', 'DESC']],
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

export async function getDetail(taskId) {
  const task = await CleaningTask.findByPk(taskId, {
    include: [
      { model: User, as: 'assignee', attributes: ['id', 'name'] },
    ],
  })

  if (!task) {
    throw new Error('清洁任务不存在')
  }

  return task.toJSON()
}

export async function create(data = {}, operatorId) {
  const {
    title,
    description,
    cleaningType,
    priority,
    scheduledDate,
    scheduledTime,
    location,
    assigneeId,
    remark,
  } = data

  if (!title || !scheduledDate) {
    throw new Error('缺少必要参数')
  }

  const taskNo = generateTaskNo()

  const task = await CleaningTask.create({
    taskNo,
    title,
    description: description || null,
    cleaningType: cleaningType || 'daily',
    priority: priority || 'medium',
    scheduledDate,
    scheduledTime: scheduledTime || null,
    location: location || null,
    assigneeId: assigneeId || operatorId || null,
    status: 'pending',
    remark: remark || null,
  })

  return getDetail(task.id)
}

export async function update(taskId, data = {}) {
  const task = await CleaningTask.findByPk(taskId)

  if (!task) {
    throw new Error('清洁任务不存在')
  }

  const allowedFields = [
    'title',
    'description',
    'cleaningType',
    'priority',
    'scheduledDate',
    'scheduledTime',
    'location',
    'assigneeId',
    'remark',
    'status',
  ]

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      task[field] = data[field]
    }
  }

  await task.save()

  return getDetail(taskId)
}

export async function startTask(taskId, operatorId) {
  const task = await CleaningTask.findByPk(taskId)

  if (!task) {
    throw new Error('清洁任务不存在')
  }

  if (task.status !== 'pending') {
    throw new Error(`当前状态 ${task.status} 不允许开始`)
  }

  task.status = 'in_progress'
  task.startedAt = new Date()
  if (!task.assigneeId && operatorId) {
    task.assigneeId = operatorId
  }
  await task.save()

  return getDetail(taskId)
}

export async function completeTask(taskId, operatorId) {
  const task = await CleaningTask.findByPk(taskId)

  if (!task) {
    throw new Error('清洁任务不存在')
  }

  if (!['pending', 'in_progress'].includes(task.status)) {
    throw new Error(`当前状态 ${task.status} 不允许完成`)
  }

  task.status = 'completed'
  task.completedAt = new Date()
  await task.save()

  return getDetail(taskId)
}

export async function cancelTask(taskId, data = {}, operatorId) {
  const { remark } = data || {}
  const task = await CleaningTask.findByPk(taskId)

  if (!task) {
    throw new Error('清洁任务不存在')
  }

  if (!['pending', 'in_progress'].includes(task.status)) {
    throw new Error(`当前状态 ${task.status} 不允许取消`)
  }

  task.status = 'cancelled'
  if (remark) {
    task.remark = task.remark ? `${task.remark}\n${remark}` : remark
  }
  await task.save()

  return getDetail(taskId)
}

export default {
  getList,
  getDetail,
  create,
  update,
  startTask,
  completeTask,
  cancelTask,
}
