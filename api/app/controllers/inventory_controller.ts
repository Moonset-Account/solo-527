import Reagent from '#models/reagent'
import { InventoryService } from '#services/inventory_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class InventoryController {
  private inventoryService = new InventoryService()

  async stats({ response }: HttpContext) {
    const stats = await this.inventoryService.getStats()
    const warnings = await this.inventoryService.checkWarnings()
    return response.ok({ stats, warnings })
  }

  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const category = request.input('category')
    const dangerLevel = request.input('dangerLevel')
    const search = request.input('search')

    const query = Reagent.query()

    if (category) {
      query.where('category', category)
    }
    if (dangerLevel) {
      query.where('danger_level', dangerLevel)
    }
    if (search) {
      query.where((builder) => {
        builder.where('name', 'ilike', `%${search}%`).orWhere('cas_number', 'ilike', `%${search}%`)
      })
    }

    const reagents = await query.paginate(page, limit)
    return response.ok(reagents)
  }

  async show({ params, response }: HttpContext) {
    const reagent = await Reagent.query()
      .where('id', params.id)
      .preload('batches')
      .first()

    if (!reagent) {
      return response.notFound({ message: '试剂未找到' })
    }

    return response.ok(reagent)
  }
}
