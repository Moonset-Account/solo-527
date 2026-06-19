import { query } from '../models/index.js'
import { AuditLogService } from './AuditLogService.js'

const auditLogService = new AuditLogService()

export class RequirementService {
  async createRequirement(data: any, userId: string) {
    const { title, description, priority, department, type, deadline } = data

    let assigneeId = data.assigneeId || null
    if (!assigneeId) {
      const defaultAssignee = await query(
        'SELECT user_id FROM default_assignees WHERE department = $1 AND requirement_type = $2',
        [department, type]
      )
      if (defaultAssignee.rows[0]) {
        assigneeId = defaultAssignee.rows[0].user_id
      }
    }

    const result = await query(
      `INSERT INTO requirements (title, description, priority, department, type, deadline, assignee_id, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [title, description, priority, department, type, deadline, assigneeId, userId]
    )

    return result.rows[0]
  }

  async listRequirements(filters: any) {
    const { status, priority, department, assigneeId, keyword, page = 1, pageSize = 20 } = filters
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (status) {
      conditions.push(`r.status = $${paramIndex++}`)
      params.push(status)
    }
    if (priority) {
      conditions.push(`r.priority = $${paramIndex++}`)
      params.push(priority)
    }
    if (department) {
      conditions.push(`r.department = $${paramIndex++}`)
      params.push(department)
    }
    if (assigneeId) {
      conditions.push(`r.assignee_id = $${paramIndex++}`)
      params.push(assigneeId)
    }
    if (keyword) {
      conditions.push(`r.title ILIKE $${paramIndex++}`)
      params.push(`%${keyword}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await query(
      `SELECT COUNT(*) as total FROM requirements r ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].total)

    const offset = (page - 1) * pageSize
    const result = await query(
      `SELECT r.*,
        u1.name as assignee_name,
        u2.name as created_by_name
       FROM requirements r
       LEFT JOIN users u1 ON r.assignee_id = u1.id
       LEFT JOIN users u2 ON r.created_by = u2.id
       ${whereClause}
       ORDER BY r.created_at DESC
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

  async getRequirementById(id: string) {
    const result = await query(
      `SELECT r.*,
        u1.name as assignee_name,
        u2.name as created_by_name
       FROM requirements r
       LEFT JOIN users u1 ON r.assignee_id = u1.id
       LEFT JOIN users u2 ON r.created_by = u2.id
       WHERE r.id = $1`,
      [id]
    )
    return result.rows[0] || null
  }

  async updateRequirement(id: string, data: any, userId: string) {
    const existing = await this.getRequirementById(id)
    if (!existing) return null

    const trackableFields = ['title', 'description', 'priority', 'department', 'type', 'deadline', 'assignee_id', 'status']
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1
    const changes: any[] = []

    for (const field of trackableFields) {
      if (data[field] !== undefined && data[field] !== existing[field]) {
        changes.push({
          field,
          old_value: existing[field],
          new_value: data[field],
        })
        updates.push(`${field} = $${paramIndex++}`)
        params.push(data[field])
      }
    }

    if (updates.length === 0) return existing

    params.push(id)
    const result = await query(
      `UPDATE requirements SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      params
    )

    for (const change of changes) {
      await query(
        `INSERT INTO requirement_histories (requirement_id, field_name, old_value, new_value, changed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, change.field, String(change.old_value ?? ''), String(change.new_value ?? ''), userId]
      )
    }

    return result.rows[0]
  }

  async deleteRequirement(id: string) {
    await query('DELETE FROM requirements WHERE id = $1', [id])
  }

  async addComment(requirementId: string, content: string, userId: string, type: string = 'comment') {
    const result = await query(
      `INSERT INTO comments (requirement_id, content, type, author_id) VALUES ($1, $2, $3, $4) RETURNING *`,
      [requirementId, content, type, userId]
    )
    return result.rows[0]
  }

  async getComments(requirementId: string) {
    const result = await query(
      `SELECT c.*, u.name as author_name FROM comments c LEFT JOIN users u ON c.author_id = u.id WHERE c.requirement_id = $1 ORDER BY c.created_at ASC`,
      [requirementId]
    )
    return result.rows
  }

  async addNote(requirementId: string, content: string, userId: string) {
    const result = await query(
      `INSERT INTO notes (requirement_id, content, author_id) VALUES ($1, $2, $3) RETURNING *`,
      [requirementId, content, userId]
    )
    return result.rows[0]
  }

  async getNotes(requirementId: string) {
    const result = await query(
      `SELECT n.*, u.name as author_name FROM notes n LEFT JOIN users u ON n.author_id = u.id WHERE n.requirement_id = $1 ORDER BY n.created_at ASC`,
      [requirementId]
    )
    return result.rows
  }

  async addAttachment(requirementId: string, file: any, userId: string) {
    const result = await query(
      `INSERT INTO attachments (requirement_id, filename, original_name, file_path, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [requirementId, file.filename, file.originalname, file.path, file.size, file.mimetype, userId]
    )
    return result.rows[0]
  }

  async getAttachments(requirementId: string) {
    const result = await query(
      'SELECT * FROM attachments WHERE requirement_id = $1 ORDER BY created_at ASC',
      [requirementId]
    )
    return result.rows
  }

  async deleteAttachment(requirementId: string, attachmentId: string) {
    const result = await query(
      'DELETE FROM attachments WHERE id = $1 AND requirement_id = $2 RETURNING *',
      [attachmentId, requirementId]
    )
    return result.rows[0] || null
  }

  async markAttachmentMissing(requirementId: string, attachmentId: string, userId: string) {
    const result = await query(
      'UPDATE attachments SET is_missing = true, updated_at = NOW() WHERE id = $1 AND requirement_id = $2 RETURNING *',
      [attachmentId, requirementId]
    )

    if (result.rows[0]) {
      await auditLogService.createLog({
        action: 'attachment_missing_mark',
        entity_type: 'attachment',
        entity_id: attachmentId,
        user_id: userId,
        details: { requirement_id: requirementId },
      })
    }

    return result.rows[0] || null
  }

  async getHistories(requirementId: string) {
    const result = await query(
      `SELECT rh.*, u.name as changed_by_name FROM requirement_histories rh LEFT JOIN users u ON rh.changed_by = u.id WHERE rh.requirement_id = $1 ORDER BY rh.created_at ASC`,
      [requirementId]
    )
    return result.rows
  }
}
