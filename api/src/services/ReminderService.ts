import { query } from '../models/index.js'

export class ReminderService {
  async createReminder(data: any, userId: string) {
    const { requirementId, reminderType, message, remindAt } = data
    const result = await query(
      `INSERT INTO reminders (requirement_id, reminder_type, message, remind_at, created_by, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [requirementId, reminderType, message, remindAt, userId]
    )
    return result.rows[0]
  }

  async listReminders(filters: any) {
    const { status, requirementId, reminderType, page = 1, pageSize = 20 } = filters
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (status) {
      conditions.push(`r.status = $${paramIndex++}`)
      params.push(status)
    }
    if (requirementId) {
      conditions.push(`r.requirement_id = $${paramIndex++}`)
      params.push(requirementId)
    }
    if (reminderType) {
      conditions.push(`r.reminder_type = $${paramIndex++}`)
      params.push(reminderType)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await query(
      `SELECT COUNT(*) as total FROM reminders r ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].total)

    const offset = (page - 1) * pageSize
    const result = await query(
      `SELECT r.*, req.title as requirement_title, u.name as created_by_name
       FROM reminders r
       LEFT JOIN requirements req ON r.requirement_id = req.id
       LEFT JOIN users u ON r.created_by = u.id
       ${whereClause}
       ORDER BY r.remind_at ASC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
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

  async acknowledgeReminder(id: string, userId: string) {
    const result = await query(
      `UPDATE reminders SET status = 'acknowledged', acknowledged_at = NOW(), acknowledged_by = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [userId, id]
    )
    return result.rows[0] || null
  }

  async checkOverdueReminders() {
    const thresholds = await query('SELECT * FROM reminder_thresholds')
    const createdReminders: any[] = []

    for (const threshold of thresholds.rows) {
      const { department, requirement_type, hours_before_deadline } = threshold
      const remindBefore = hours_before_deadline * 60 * 60 * 1000

      const overdueRequirements = await query(
        `SELECT * FROM requirements
         WHERE status NOT IN ('completed', 'cancelled')
         AND department = $1 AND type = $2
         AND deadline IS NOT NULL
         AND deadline <= NOW() + INTERVAL '1 millisecond' * $3
         AND deadline > NOW()
         AND id NOT IN (
           SELECT requirement_id FROM reminders
           WHERE reminder_type = 'overdue' AND status = 'pending'
           AND created_at > NOW() - INTERVAL '24 hours'
         )`,
        [department, requirement_type, remindBefore]
      )

      for (const req of overdueRequirements.rows) {
        const reminder = await query(
          `INSERT INTO reminders (requirement_id, reminder_type, message, remind_at, created_by, status)
           VALUES ($1, 'overdue', $2, NOW(), NULL, 'pending') RETURNING *`,
          [req.id, `需求「${req.title}」即将到期，请及时处理`]
        )
        createdReminders.push(reminder.rows[0])
      }
    }

    return createdReminders
  }
}
