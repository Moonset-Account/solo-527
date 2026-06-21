import OperationHistory from '#models/operation_history'
import type { HttpContext } from '@adonisjs/core/http'

export default class OperationHistoryController {
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const action = request.input('action')
    const targetType = request.input('targetType')

    const query = OperationHistory.query().preload('operator')

    if (action) {
      query.where('action', action)
    }
    if (targetType) {
      query.where('target_type', targetType)
    }

    const histories = await query.orderBy('created_at', 'desc').paginate(page, limit)
    return response.ok(histories)
  }

  async addNote({ params, request, response }: HttpContext) {
    const { handoverNote } = request.only(['handoverNote'])

    const history = await OperationHistory.findOrFail(params.id)
    history.handoverNote = handoverNote
    await history.save()

    await history.load('operator')
    return response.ok(history)
  }
}
