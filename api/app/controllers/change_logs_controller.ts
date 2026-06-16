import { HttpContext } from '@adonisjs/core/http'
import ChangeLogService from '#services/change_log_service'

export default class ChangeLogsController {
  public async index({ request, response }: HttpContext) {
    const entityType = request.input('entity_type')
    const entityId = request.input('entity_id')

    if (entityType && entityId) {
      const page = request.input('page', 1)
      const perPage = request.input('perPage', 20)
      const logs = await ChangeLogService.getEntityHistory(entityType, entityId, page, perPage)
      return response.ok(logs)
    }

    const limit = request.input('limit', 50)
    const logs = await ChangeLogService.getRecentChanges(limit)
    return response.ok(logs)
  }

  public async show({ params, response }: HttpContext) {
    const log = await ChangeLogService.getEntityHistory('any', params.id, 1, 1)
    return response.ok(log)
  }
}
