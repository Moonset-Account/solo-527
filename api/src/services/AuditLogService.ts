import { query } from '../models/index.js'

export class AuditLogService {
  async createLog(data: {
    action: string
    entity_type: string
    entity_id: string
    user_id: string
    details?: any
  }) {
    const { action, entity_type, entity_id, user_id, details } = data
    const result = await query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [action, entity_type, entity_id, user_id, JSON.stringify(details || {})]
    )
    return result.rows[0]
  }

  async listLogs(filters: any) {
    const { action, entity_type, user_id, startDate, endDate, page = 1, pageSize = 20 } = filters
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (action) {
      conditions.push(`a.action = $${paramIndex++}`)
      params.push(action)
    }
    if (entity_type) {
      conditions.push(`a.entity_type = $${paramIndex++}`)
      params.push(entity_type)
    }
    if (user_id) {
      conditions.push(`a.user_id = $${paramIndex++}`)
      params.push(user_id)
    }
    if (startDate) {
      conditions.push(`a.created_at >= $${paramIndex++}`)
      params.push(startDate)
    }
    if (endDate) {
      conditions.push(`a.created_at <= $${paramIndex++}`)
      params.push(endDate)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await query(
      `SELECT COUNT(*) as total FROM audit_logs a ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].total)

    const offset = (page - 1) * pageSize
    const result = await query(
      `SELECT a.*, u.name as user_name FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ${whereClause} ORDER BY a.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, pageSize, offset]
    )

    return {
      data: result.rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }
}
