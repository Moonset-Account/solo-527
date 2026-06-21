import Reagent from '#models/reagent'
import AuditLog from '#models/audit_log'
import type { HttpContext } from '@adonisjs/core/http'

export default class ComplianceController {
  async filter({ request, response }: HttpContext) {
    const dangerLevel = request.input('dangerLevel')
    const isControlled = request.input('isControlled')
    const category = request.input('category')

    const query = Reagent.query()

    if (dangerLevel) {
      query.where('danger_level', dangerLevel)
    }
    if (isControlled !== undefined) {
      query.where('is_controlled', isControlled === 'true' || isControlled === true)
    }
    if (category) {
      query.where('category', category)
    }

    const reagents = await query
    return response.ok(reagents)
  }

  async auditLogs({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const action = request.input('action')
    const targetType = request.input('targetType')

    const query = AuditLog.query().preload('operator')

    if (action) {
      query.where('action', action)
    }
    if (targetType) {
      query.where('target_type', targetType)
    }

    const logs = await query.orderBy('created_at', 'desc').paginate(page, limit)
    return response.ok(logs)
  }

  async drilldown({ params, response }: HttpContext) {
    const logs = await AuditLog.query()
      .where('target_id', params.id)
      .preload('operator')
      .orderBy('created_at', 'desc')

    return response.ok(logs)
  }
}
