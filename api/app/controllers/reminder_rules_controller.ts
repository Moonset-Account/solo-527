import { HttpContext } from '@adonisjs/core/http'
import ReminderRule from '#models/reminder_rule'
import ChangeLogService from '#services/change_log_service'

export default class ReminderRulesController {
  public async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)

    const rules = await ReminderRule.query().orderBy('createdAt', 'desc').paginate(page, perPage)
    return response.ok(rules)
  }

  public async show({ params, response }: HttpContext) {
    const rule = await ReminderRule.query().where('id', params.id).preload('reminders').firstOrFail()
    return response.ok(rule)
  }

  public async store({ request, response, auth }: HttpContext) {
    const data = request.only([
      'name',
      'entityType',
      'metric',
      'operator',
      'threshold',
      'level',
      'messageTemplate',
      'timeoutMinutes',
      'escalationLevel',
      'isActive',
    ])

    if (!data.name || !data.entityType || !data.metric || !data.operator || data.threshold === undefined) {
      return response.badRequest({ message: '规则名称、实体类型、指标、运算符和阈值为必填项' })
    }

    const rule = await ReminderRule.create(data)

    await ChangeLogService.logChange('reminder_rule', rule.id, 'create', null, null, null, auth.user!.id)

    return response.created(rule)
  }

  public async update({ params, request, response, auth }: HttpContext) {
    const rule = await ReminderRule.findOrFail(params.id)
    const oldValues = rule.toJSON()

    const data = request.only([
      'name',
      'entityType',
      'metric',
      'operator',
      'threshold',
      'level',
      'messageTemplate',
      'timeoutMinutes',
      'escalationLevel',
      'isActive',
    ])

    rule.merge(data)
    await rule.save()

    await ChangeLogService.logEntityChanges('reminder_rule', rule.id, oldValues, data, auth.user!.id)

    return response.ok(rule)
  }

  public async destroy({ params, response }: HttpContext) {
    const rule = await ReminderRule.findOrFail(params.id)
    await rule.delete()
    return response.noContent()
  }
}
