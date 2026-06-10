import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ScheduleValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    workOrderId: schema.number([
      rules.exists({ table: 'work_orders', column: 'id' }),
    ]),
    scheduleDate: schema.date(),
    workshop: schema.string.optional({}, [
      rules.maxLength(100),
    ]),
    line: schema.string.optional({}, [
      rules.maxLength(50),
    ]),
    plannedQuantity: schema.number([
      rules.unsigned(),
    ]),
    shift: schema.enum.optional(['morning', 'afternoon', 'night']),
    notes: schema.string.optional(),
  })

  public messages = {
    'workOrderId.required': '工单ID不能为空',
    'workOrderId.exists': '工单不存在',
    'scheduleDate.required': '排产日期不能为空',
    'plannedQuantity.required': '计划数量不能为空',
    'plannedQuantity.unsigned': '计划数量必须是非负数',
  }
}
