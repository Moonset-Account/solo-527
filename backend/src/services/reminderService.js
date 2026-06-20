import { Op } from 'sequelize'
import { Reminder, ReminderRule, User } from '../db/models.js'
import redis from '../config/redis.js'

export const getReminders = async (params = {}) => {
  const {
    page = 1,
    pageSize = 20,
    type,
    level,
    status,
    userId
  } = params

  const where = {}

  if (type) {
    where.type = type
  }

  if (level) {
    where.level = level
  }

  if (status) {
    where.status = status
  }

  if (userId) {
    where.recipientIds = { [Op.contains]: [parseInt(userId)] }
  }

  const { count, rows } = await Reminder.findAndCountAll({
    where,
    include: [
      { model: ReminderRule, as: 'rule', attributes: ['id', 'name'] }
    ],
    order: [
      [{ level: 'DESC' }],
      ['triggeredAt', 'DESC']
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

export const getUnreadCount = async (userId) => {
  const cacheKey = `reminder:unread:${userId}`
  const cached = await redis.get(cacheKey)

  if (cached !== null) {
    return parseInt(cached)
  }

  const count = await Reminder.count({
    where: {
      status: 'unread',
      recipientIds: { [Op.contains]: [parseInt(userId)] }
    }
  })

  await redis.set(cacheKey, count, 'EX', 30)

  return count
}

export const createReminder = async (data) => {
  const reminder = await Reminder.create(data)

  if (data.recipientIds && data.recipientIds.length > 0) {
    for (const userId of data.recipientIds) {
      await redis.del(`reminder:unread:${userId}`)
    }
  }

  return reminder
}

export const markAsRead = async (id, userId) => {
  const reminder = await Reminder.findByPk(id)
  if (!reminder) {
    throw new Error('提醒不存在')
  }

  const readBy = reminder.readBy || []
  if (!readBy.includes(userId)) {
    readBy.push(userId)
    await reminder.update({ readBy })

    const allRead = reminder.recipientIds?.every(id => readBy.includes(id))
    if (allRead) {
      await reminder.update({ status: 'read' })
    }
  }

  await redis.del(`reminder:unread:${userId}`)

  return reminder
}

export const markAllAsRead = async (userId) => {
  const reminders = await Reminder.findAll({
    where: {
      status: 'unread',
      recipientIds: { [Op.contains]: [parseInt(userId)] }
    }
  })

  for (const reminder of reminders) {
    const readBy = reminder.readBy || []
    if (!readBy.includes(userId)) {
      readBy.push(userId)
      await reminder.update({ readBy })
    }
  }

  await redis.del(`reminder:unread:${userId}`)

  return true
}

export const getReminderRules = async (params = {}) => {
  const { type, enabled } = params

  const where = {}

  if (type) {
    where.type = type
  }

  if (enabled !== undefined) {
    where.enabled = enabled
  }

  const rules = await ReminderRule.findAll({
    where,
    order: [['createdAt', 'DESC']]
  })

  return rules
}

export const createReminderRule = async (data, userId) => {
  const rule = await ReminderRule.create({
    ...data,
    createdBy: userId
  })
  return rule
}

export const updateReminderRule = async (id, data) => {
  const rule = await ReminderRule.findByPk(id)
  if (!rule) {
    throw new Error('提醒规则不存在')
  }

  await rule.update(data)
  return rule
}

export const deleteReminderRule = async (id) => {
  const rule = await ReminderRule.findByPk(id)
  if (!rule) {
    throw new Error('提醒规则不存在')
  }

  await rule.destroy()
  return true
}

export const checkAndTriggerDriverDelay = async (scheduleId, delayMinutes) => {
  const rules = await ReminderRule.findAll({
    where: {
      type: 'driver_delay',
      enabled: true
    }
  })

  const triggered = []

  for (const rule of rules) {
    const condition = rule.triggerCondition
    if (!condition) continue

    const threshold = condition.delayMinutes || 0
    const level = rule.level

    if (delayMinutes >= threshold) {
      const operators = await User.findAll({
        where: {
          role: rule.recipientRoles || ['operator'],
          status: 'active'
        }
      })

      const recipientIds = operators.map(u => u.id)

      const reminder = await createReminder({
        ruleId: rule.id,
        type: 'driver_delay',
        level,
        title: rule.name,
        content: `司机延误 ${delayMinutes} 分钟，请及时处理。排期ID: ${scheduleId}`,
        relatedId: scheduleId,
        relatedType: 'tour_schedule',
        recipientIds
      })

      triggered.push(reminder)
    }
  }

  return triggered
}
