import { ReminderService } from '../services/ReminderService.js'

const reminderService = new ReminderService()

export class ReminderController {
  async index(req: any, res: any) {
    try {
      const result = await reminderService.listReminders(req.query)
      return res.json(result)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async store(req: any, res: any) {
    try {
      const { requirementId, reminderType, message, remindAt } = req.body
      if (!requirementId || !reminderType || !message) {
        return res.status(400).json({ error: '需求ID、提醒类型和消息不能为空' })
      }
      const reminder = await reminderService.createReminder(req.body, req.user.id)
      return res.status(201).json(reminder)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async acknowledge(req: any, res: any) {
    try {
      const reminder = await reminderService.acknowledgeReminder(req.params.id, req.user.id)
      if (!reminder) {
        return res.status(404).json({ error: '提醒不存在' })
      }
      return res.json(reminder)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }
}
