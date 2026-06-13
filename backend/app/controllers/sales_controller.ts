import type { HttpContext } from '@adonisjs/core/http'
import Sale from '#models/sale'
import SaleItem from '#models/sale_item'
import { schema, rules } from '@adonisjs/validator'
import db from '@adonisjs/lucid/services/db'

export default class SalesController {
  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const storeId = request.input('store_id')
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')

    const query = Sale.query().preload('creator')

    if (user.storeId) {
      query.where('storeId', user.storeId)
    } else if (storeId) {
      query.where('storeId', storeId)
    }

    if (startDate) {
      query.where('saleDate', '>=', startDate)
    }
    if (endDate) {
      query.where('saleDate', '<=', endDate)
    }

    query.orderBy('saleDate', 'desc')
    query.orderBy('id', 'desc')

    const sales = await query.paginate(page, limit)
    return response.ok(sales)
  }

  async show({ params, response }: HttpContext) {
    const sale = await Sale.query()
      .where('id', params.id)
      .preload('items')
      .preload('creator')
      .preload('store')
      .firstOrFail()

    return response.ok(sale)
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const data = await request.validateUsing(
      schema.create({
        storeId: schema.number(),
        saleDate: schema.date(),
        totalAmount: schema.number(),
        orderCount: schema.number(),
        costAmount: schema.number.optional([rules.range(0, 99999999.99)]),
        profitAmount: schema.number.optional([rules.range(-99999999.99, 99999999.99)]),
        discountAmount: schema.number.optional([rules.range(0, 99999999.99)]),
        remark: schema.string.optional(),
        items: schema.array.optional().members(
          schema.object().members({
            productName: schema.string(),
            quantity: schema.number(),
            unitPrice: schema.number(),
            subtotal: schema.number(),
            cost: schema.number.optional(),
          })
        ),
      })
    )

    const trx = await db.transaction()

    try {
      const sale = await Sale.create({
        ...data,
        createdBy: user.id,
        profitAmount: data.profitAmount ?? data.totalAmount - (data.costAmount ?? 0),
      }, { client: trx })

      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await SaleItem.create({
            ...item,
            saleId: sale.id,
          }, { client: trx })
        }
      }

      await trx.commit()
      await sale.load('items')

      return response.created(sale)
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}
