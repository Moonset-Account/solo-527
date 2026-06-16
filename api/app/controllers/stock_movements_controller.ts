import { HttpContext } from '@adonisjs/core/http'
import StockMovement from '#models/stock_movement'
import InventoryService from '#services/inventory_service'

export default class StockMovementsController {
  public async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const productId = request.input('product_id')
    const type = request.input('type')

    const query = StockMovement.query().preload('product').preload('operator')

    if (productId) query.where('productId', productId)
    if (type) query.where('type', type)

    const movements = await query.orderBy('createdAt', 'desc').paginate(page, perPage)
    return response.ok(movements)
  }

  public async stockIn({ request, response, auth }: HttpContext) {
    const { productId, quantity, reason } = request.only(['productId', 'quantity', 'reason'])

    if (!productId || !quantity || quantity <= 0) {
      return response.badRequest({ message: '产品ID和有效数量为必填项' })
    }

    const product = await InventoryService.stockIn(productId, quantity, auth.user!.id, reason)
    return response.ok(product)
  }

  public async stockOut({ request, response, auth }: HttpContext) {
    const { productId, quantity, reason, appointmentId } = request.only([
      'productId',
      'quantity',
      'reason',
      'appointmentId',
    ])

    if (!productId || !quantity || quantity <= 0) {
      return response.badRequest({ message: '产品ID和有效数量为必填项' })
    }

    const product = await InventoryService.stockOut(
      productId,
      quantity,
      auth.user!.id,
      reason,
      appointmentId || null
    )
    return response.ok(product)
  }

  public async stockDamage({ request, response, auth }: HttpContext) {
    const { productId, quantity, reason } = request.only(['productId', 'quantity', 'reason'])

    if (!productId || !quantity || quantity <= 0) {
      return response.badRequest({ message: '产品ID和有效数量为必填项' })
    }

    const product = await InventoryService.stockDamage(productId, quantity, auth.user!.id, reason)
    return response.ok(product)
  }
}
