import type { HttpContext } from '@adonisjs/core/http'
import LossReason from '#models/loss_reason'
import { schema, rules } from '@adonisjs/validator'

export default class LossReasonsController {
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const type = request.input('type')
    const isActive = request.input('is_active')

    const query = LossReason.query()

    if (type) {
      query.where('type', type)
    }
    if (isActive !== undefined) {
      query.where('isActive', isActive === 'true' || isActive === true)
    }

    query.orderBy('sortOrder', 'asc')
    query.orderBy('id', 'desc')

    const lossReasons = await query.paginate(page, limit)
    return response.ok(lossReasons)
  }

  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(
      schema.create({
        name: schema.string([rules.maxLength(100)]),
        code: schema.string([rules.maxLength(50), rules.unique({ table: 'loss_reasons', column: 'code' })]),
        type: schema.enum(['ingredient', 'product', 'equipment', 'other']),
        description: schema.string.optional(),
        sortOrder: schema.number.optional(),
      })
    )

    const lossReason = await LossReason.create(data)
    return response.created(lossReason)
  }

  async update({ params, request, response }: HttpContext) {
    const lossReason = await LossReason.findOrFail(params.id)

    const data = await request.validateUsing(
      schema.create({
        name: schema.string.optional([rules.maxLength(100)]),
        code: schema.string.optional([rules.maxLength(50)]),
        type: schema.enum.optional(['ingredient', 'product', 'equipment', 'other']),
        description: schema.string.optional(),
        isActive: schema.boolean.optional(),
        sortOrder: schema.number.optional(),
      })
    )

    lossReason.merge(data)
    await lossReason.save()

    return response.ok(lossReason)
  }

  async destroy({ params, response }: HttpContext) {
    const lossReason = await LossReason.findOrFail(params.id)
    await lossReason.delete()
    return response.ok({ message: '删除成功' })
  }
}
