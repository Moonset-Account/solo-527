import { HttpContext } from '@adonisjs/core/http'
import Reminder from '#models/reminder'
import ReminderService from '#services/reminder_service'

export default class RemindersController {
  public async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const level = request.input('level')
    const isResolved = request.input('is_resolved')

    const query = Reminder.query().preload('rule')

    if (level) query.where('level', level)
    if (isResolved !== undefined) query.where('isResolved', isResolved === 'true')

    const reminders = await query.orderBy('createdAt', 'desc').paginate(page, perPage)
    return response.ok(reminders)
  }

  public async show({ params, response }: HttpContext) {
    const reminder = await Reminder.query().where('id', params.id).preload('rule').firstOrFail()
    return response.ok(reminder)
  }

  public async markAsRead({ params, response }: HttpContext) {
    const reminder = await ReminderService.markAsRead(params.id)
    return response.ok(reminder)
  }

  public async resolve({ params, response }: HttpContext) {
    const reminder = await ReminderService.resolveReminder(params.id)
    return response.ok(reminder)
  }

  public async escalate({ params, request, response }: HttpContext) {
    const { level } = request.only(['level'])
    if (!level) {
      return response.badRequest({ message: '升级级别为必填项' })
    }

    const reminder = await Reminder.findOrFail(params.id)
    const result = await ReminderService.escalateReminder(reminder, level)
    return response.ok(result)
  }

  public async unreadCount({ response }: HttpContext) {
    const count = await ReminderService.getUnreadCount()
    return response.ok(count)
  }
}
