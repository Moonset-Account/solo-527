import { Op } from 'sequelize'
import models from '../Models/index.js'

const { Reminder, ReminderRule, User } = models

export async function getList(params = {}) {
  const { page = 1, pageSize = 20, status, level, userId } = params

  const where = {}

  if (status) where.status = status
  if (level) where.level = level

  const include = [
    { model: ReminderRule, as: 'rule', attributes: ['id', 'name', 'type'] },
  ]

  const { count, rows } = await Reminder.findAndCountAll({
    where,
    include,
    order: [['createdAt', 'DESC']],
    limit: Number(pageSize),
    offset: (Number(page) - 1) * Number(pageSize),
  })

  const list = rows.map((r) => {
    const json = r.toJSON()
    let isRead = false
    if (userId && Array.isArray(r.readBy)) {
      isRead = r.readBy.includes(userId)
    } else if (r.status === 'read') {
      isRead = true
    }
    return { ...json, isRead }
  })

  return {
    list,
    total: count,
    page: Number(page),
    pageSize: Number(pageSize),
    lastPage: Math.ceil(count / Number(pageSize)),
  }
}

export async function markRead(reminderId, userId) {
  const reminder = await Reminder.findByPk(reminderId)

  if (!reminder) {
    throw new Error('提醒不存在')
  }

  const readBy = Array.isArray(reminder.readBy) ? [...reminder.readBy] : []
  if (!readBy.includes(userId)) {
    readBy.push(userId)
  }

  let allMarked = false
  const recipientIds = Array.isArray(reminder.recipientIds) ? reminder.recipientIds : []
  if (recipientIds.length > 0 && readBy.length >= recipientIds.length) {
    allMarked = true
  }

  await reminder.update({
    readBy,
    status: allMarked ? 'read' : reminder.status,
  })

  return reminder.toJSON()
}

export async function markAllRead(userId) {
  const reminders = await Reminder.findAll({
    where: {
      status: { [Op.ne]: 'read' },
    },
  })

  let updatedCount = 0

  for (const reminder of reminders) {
    const readBy = Array.isArray(reminder.readBy) ? [...reminder.readBy] : []
    if (!readBy.includes(userId)) {
      readBy.push(userId)
      await reminder.update({ readBy, status: 'read' })
      updatedCount++
    }
  }

  return { updatedCount }
}

export async function getUnreadCount(userId) {
  const allReminders = await Reminder.findAll({
    where: {
      status: { [Op.ne]: 'read' },
    },
    attributes: ['id', 'readBy', 'recipientIds'],
  })

  let count = 0

  for (const r of allReminders) {
    const readBy = Array.isArray(r.readBy) ? r.readBy : []
    if (!readBy.includes(userId)) {
      count++
    }
  }

  return { count }
}

export async function getRules(params = {}) {
  const { page = 1, pageSize = 20, type, enabled } = params

  const where = {}

  if (type) where.type = type
  if (enabled !== undefined) where.enabled = enabled

  const include = [
    { model: User, as: 'creator', attributes: ['id', 'name'] },
  ]

  const { count, rows } = await ReminderRule.findAndCountAll({
    where,
    include,
    order: [['createdAt', 'DESC']],
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

export async function createRule(data = {}, userId) {
  const {
    name,
    type,
    level,
    triggerCondition,
    notificationChannels,
    recipientRoles,
    templateTitle,
    templateContent,
    enabled,
  } = data

  if (!name || !type || !templateTitle || !templateContent) {
    throw new Error('缺少必要参数')
  }

  const rule = await ReminderRule.create({
    name,
    type,
    level: level || 'normal',
    triggerCondition: triggerCondition || {},
    notificationChannels: notificationChannels || ['app'],
    recipientRoles: recipientRoles || ['operator'],
    templateTitle,
    templateContent,
    enabled: enabled !== undefined ? enabled : true,
    createdBy: userId,
  })

  return rule.toJSON()
}

export async function updateRule(ruleId, data = {}) {
  const rule = await ReminderRule.findByPk(ruleId)

  if (!rule) {
    throw new Error('规则不存在')
  }

  const allowedFields = [
    'name',
    'type',
    'level',
    'triggerCondition',
    'notificationChannels',
    'recipientRoles',
    'templateTitle',
    'templateContent',
    'enabled',
  ]

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      rule[field] = data[field]
    }
  }

  await rule.save()

  return rule.toJSON()
}

export async function deleteRule(ruleId) {
  const rule = await ReminderRule.findByPk(ruleId)

  if (!rule) {
    throw new Error('规则不存在')
  }

  await rule.destroy()

  return { success: true }
}

export async function toggleRule(ruleId, enabled) {
  const rule = await ReminderRule.findByPk(ruleId)

  if (!rule) {
    throw new Error('规则不存在')
  }

  const newEnabled = enabled !== undefined ? enabled : !rule.enabled

  await rule.update({ enabled: newEnabled })

  return rule.toJSON()
}

export default {
  getList,
  markRead,
  markAllRead,
  getUnreadCount,
  getRules,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
}
