import type { HttpContext } from '@adonisjs/core/http'
import SafetyStock from '#models/safety_stock'
import { schema, rules } from '@adonisjs/validator'

export default class SafetyStocksController {
  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const storeId = request.input('store_id')
    const ingredientId = request.input('ingredient_id')

    const query = SafetyStock.query()
      .preload('ingredient')
      .preload('store')

    if (user.storeId) {
      query.where('storeId', user.storeId)
    } else if (storeId) {
      query.where('storeId', storeId)
    }

    if (ingredientId) {
      query.where('ingredientId', ingredientId)
    }

    query.orderBy('id', 'desc')

    const safetyStocks = await query.paginate(page, limit)
    return response.ok(safetyStocks)
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const data = await request.validateUsing(
      schema.create({
        storeId: schema.number(),
        ingredientId: schema.number(),
        minQuantity: schema.number([rules.range(0, 999999.99)]),
        maxQuantity: schema.number([rules.range(0, 999999.99)]),
        warningQuantity: schema.number([rules.range(0, 999999.99)]),
      })
    )

    const existing = await SafetyStock.query()
      .where('storeId', data.storeId)
      .where('ingredientId', data.ingredientId)
      .first()

    if (existing) {
      return response.conflict({ message: '该食材的安全库存已设置' })
    }

    const safetyStock = await SafetyStock.create(data)
    await safetyStock.load('ingredient')
    await safetyStock.load('store')

    return response.created(safetyStock)
  }

  async update({ params, request, response }: HttpContext) {
    const safetyStock = await SafetyStock.findOrFail(params.id)

    const data = await request.validateUsing(
      schema.create({
        minQuantity: schema.number.optional([rules.range(0, 999999.99)]),
        maxQuantity: schema.number.optional([rules.range(0, 999999.99)]),
        warningQuantity: schema.number.optional([rules.range(0, 999999.99)]),
      })
    )

    safetyStock.merge(data)
    await safetyStock.save()

    await safetyStock.load('ingredient')
    await safetyStock.load('store')

    return response.ok(safetyStock)
  }

  async destroy({ params, response }: HttpContext) {
    const safetyStock = await SafetyStock.findOrFail(params.id)
    await safetyStock.delete()
    return response.ok({ message: '删除成功' })
  }
}
