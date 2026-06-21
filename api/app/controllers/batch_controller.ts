import ReagentBatch from '#models/reagent_batch'
import type { HttpContext } from '@adonisjs/core/http'

export default class BatchController {
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const batches = await ReagentBatch.query()
      .preload('reagent')
      .orderBy('created_at', 'desc')
      .paginate(page, limit)

    return response.ok(batches)
  }

  async detail({ params, response }: HttpContext) {
    const batch = await ReagentBatch.query()
      .where('id', params.id)
      .preload('reagent')
      .first()

    if (!batch) {
      return response.notFound({ message: '批次未找到' })
    }

    return response.ok(batch)
  }

  async byReagent({ params, response }: HttpContext) {
    const batches = await ReagentBatch.query()
      .where('reagent_id', params.id)
      .orderBy('created_at', 'desc')

    return response.ok(batches)
  }
}
