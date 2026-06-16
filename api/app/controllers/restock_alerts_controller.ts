import { HttpContext } from '@adonisjs/core/http'
import RestockAlert from '#models/restock_alert'
import InventoryService from '#services/inventory_service'

export default class RestockAlertsController {
  public async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const status = request.input('status')

    const query = RestockAlert.query().preload('product').preload('creator')

    if (status) query.where('status', status)

    const alerts = await query.orderBy('createdAt', 'desc').paginate(page, perPage)
    return response.ok(alerts)
  }

  public async show({ params, response }: HttpContext) {
    const alert = await RestockAlert.query()
      .where('id', params.id)
      .preload('product')
      .preload('creator')
      .firstOrFail()

    return response.ok(alert)
  }

  public async resolve({ params, response, auth }: HttpContext) {
    const alert = await InventoryService.resolveRestockAlert(params.id, auth.user!.id)
    return response.ok(alert)
  }

  public async pendingCount({ response }: HttpContext) {
    const count = await RestockAlert.query().where('status', 'pending').count('* as total').first()
    return response.ok({ pendingCount: Number(count?.$extras.total || 0) })
  }
}
