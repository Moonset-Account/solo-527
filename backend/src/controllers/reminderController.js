import {
  getReminders,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getReminderRules,
  createReminderRule,
  updateReminderRule,
  deleteReminderRule,
  checkAndTriggerDriverDelay
} from '../services/reminderService.js'

export const listReminders = async (req, res) => {
  try {
    const params = {
      ...req.query,
      userId: req.user.id
    }
    const result = await getReminders(params)
    res.json({
      code: 0,
      message: 'success',
      data: result
    })
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: error.message
    })
  }
}

export const unreadCount = async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id)
    res.json({
      code: 0,
      message: 'success',
      data: { count }
    })
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: error.message
    })
  }
}

export const markAsReadController = async (req, res) => {
  try {
    const reminder = await markAsRead(req.params.id, req.user.id)
    res.json({
      code: 0,
      message: '标记成功',
      data: reminder
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}

export const markAllAsReadController = async (req, res) => {
  try {
    await markAllAsRead(req.user.id)
    res.json({
      code: 0,
      message: '全部已读'
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}

export const listReminderRules = async (req, res) => {
  try {
    const rules = await getReminderRules(req.query)
    res.json({
      code: 0,
      message: 'success',
      data: rules
    })
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: error.message
    })
  }
}

export const createReminderRuleController = async (req, res) => {
  try {
    const rule = await createReminderRule(req.body, req.user.id)
    res.status(201).json({
      code: 0,
      message: '创建成功',
      data: rule
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}

export const updateReminderRuleController = async (req, res) => {
  try {
    const rule = await updateReminderRule(req.params.id, req.body)
    res.json({
      code: 0,
      message: '更新成功',
      data: rule
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}

export const deleteReminderRuleController = async (req, res) => {
  try {
    await deleteReminderRule(req.params.id)
    res.json({
      code: 0,
      message: '删除成功'
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}

export const triggerDriverDelay = async (req, res) => {
  try {
    const { scheduleId, delayMinutes } = req.body
    const reminders = await checkAndTriggerDriverDelay(scheduleId, delayMinutes)
    res.json({
      code: 0,
      message: '触发成功',
      data: reminders
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}
