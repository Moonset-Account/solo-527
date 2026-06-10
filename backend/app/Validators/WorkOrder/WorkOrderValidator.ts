import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class WorkOrderValidator {
  constructor(protected ctx: HttpContextContract) {}

  public refs = schema.refs({
    workOrderId: this.ctx.params?.id || null,
  })

  public schema = schema.create({
    orderNo: schema.string({}, [
      rules.maxLength(50),
      rules.unique({
        table: 'work_orders',
        column: 'order_no',
        whereNot: this.refs.workOrderId ? { id: this.refs.workOrderId } : undefined,
      }),
    ]),
    productName: schema.string({}, [
      rules.maxLength(200),
    ]),
    productModel: schema.string.optional({}, [
      rules.maxLength(100),
    ]),
    quantity: schema.number([
      rules.unsigned(),
    ]),
    customerName: schema.string.optional({}, [
      rules.maxLength(100),
    ]),
    priority: schema.enum(['low', 'medium', 'high', 'urgent'] as const),
    status: schema.enum.optional([
      'pending',
      'scheduled',
      'in_production',
      'completed',
      'delayed',
      'cancelled',
    ] as const),
    plannedStartDate: schema.date.optional(),
    plannedEndDate: schema.date.optional(),
    deliveryDate: schema.date.optional(),
    assignedTo: schema.number.optional([
      rules.exists({ table: 'users', column: 'id' }),
    ]),
    remarks: schema.string.optional(),
  })

  public messages = {
    'orderNo.required': '工单号不能为空',
    'orderNo.unique': '工单号已存在',
    'productName.required': '产品名称不能为空',
    'quantity.required': '数量不能为空',
    'quantity.unsigned': '数量必须是非负数',
    'priority.enum': '优先级不正确',
    'status.enum': '状态值不正确',
  }
}
