import { query } from '../models/index.js'
import bcrypt from 'bcryptjs'
import { AuditLogService } from '../services/AuditLogService.js'
import { getCached, invalidateCache } from '../services/RedisService.js'

const auditLogService = new AuditLogService()

export class AdminController {
  async listDictionaries(req: any, res: any) {
    try {
      const { type } = req.query
      const cacheKey = `dictionaries:${type || 'all'}`
      const result = await getCached(
        cacheKey,
        async () => {
          const params: any[] = []
          let sql = 'SELECT * FROM dictionaries'
          if (type) {
            sql += ' WHERE type = $1'
            params.push(type)
          }
          sql += ' ORDER BY type, sort_order, created_at'
          const r = await query(sql, params)
          return r.rows
        },
        600
      )
      return res.json(result)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async createDictionary(req: any, res: any) {
    try {
      const { type, value, label, sortOrder } = req.body
      if (!type || !value || !label) {
        return res.status(400).json({ error: '类型、值和标签不能为空' })
      }
      const result = await query(
        'INSERT INTO dictionaries (type, value, label, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
        [type, value, label, sortOrder || 0]
      )
      await invalidateCache('dictionaries:*')
      return res.status(201).json(result.rows[0])
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async updateDictionary(req: any, res: any) {
    try {
      const { type, value, label, sortOrder } = req.body
      const result = await query(
        'UPDATE dictionaries SET type = COALESCE($1, type), value = COALESCE($2, value), label = COALESCE($3, label), sort_order = COALESCE($4, sort_order), updated_at = NOW() WHERE id = $5 RETURNING *',
        [type, value, label, sortOrder, req.params.id]
      )
      if (!result.rows[0]) {
        return res.status(404).json({ error: '字典项不存在' })
      }
      await invalidateCache('dictionaries:*')
      return res.json(result.rows[0])
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async deleteDictionary(req: any, res: any) {
    try {
      const result = await query('DELETE FROM dictionaries WHERE id = $1 RETURNING *', [req.params.id])
      if (!result.rows[0]) {
        return res.status(404).json({ error: '字典项不存在' })
      }
      await invalidateCache('dictionaries:*')
      return res.json({ message: '删除成功' })
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async listThresholds(req: any, res: any) {
    try {
      const result = await query('SELECT * FROM reminder_thresholds ORDER BY department, requirement_type')
      return res.json(result.rows)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async createThreshold(req: any, res: any) {
    try {
      const { department, requirementType, hoursBeforeDeadline } = req.body
      if (!department || !requirementType || hoursBeforeDeadline === undefined) {
        return res.status(400).json({ error: '部门、需求类型和提前小时数不能为空' })
      }
      const result = await query(
        'INSERT INTO reminder_thresholds (department, requirement_type, hours_before_deadline) VALUES ($1, $2, $3) RETURNING *',
        [department, requirementType, hoursBeforeDeadline]
      )
      return res.status(201).json(result.rows[0])
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async updateThreshold(req: any, res: any) {
    try {
      const { department, requirementType, hoursBeforeDeadline } = req.body
      const result = await query(
        'UPDATE reminder_thresholds SET department = COALESCE($1, department), requirement_type = COALESCE($2, requirement_type), hours_before_deadline = COALESCE($3, hours_before_deadline), updated_at = NOW() WHERE id = $4 RETURNING *',
        [department, requirementType, hoursBeforeDeadline, req.params.id]
      )
      if (!result.rows[0]) {
        return res.status(404).json({ error: '阈值不存在' })
      }
      return res.json(result.rows[0])
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async deleteThreshold(req: any, res: any) {
    try {
      const result = await query('DELETE FROM reminder_thresholds WHERE id = $1 RETURNING *', [req.params.id])
      if (!result.rows[0]) {
        return res.status(404).json({ error: '阈值不存在' })
      }
      return res.json({ message: '删除成功' })
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async listDefaultAssignees(req: any, res: any) {
    try {
      const result = await query(
        `SELECT da.*, u.name as user_name FROM default_assignees da LEFT JOIN users u ON da.user_id = u.id ORDER BY da.department, da.requirement_type`
      )
      return res.json(result.rows)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async createDefaultAssignee(req: any, res: any) {
    try {
      const { department, requirementType, userId } = req.body
      if (!department || !requirementType || !userId) {
        return res.status(400).json({ error: '部门、需求类型和用户ID不能为空' })
      }
      const result = await query(
        'INSERT INTO default_assignees (department, requirement_type, user_id) VALUES ($1, $2, $3) RETURNING *',
        [department, requirementType, userId]
      )
      return res.status(201).json(result.rows[0])
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async updateDefaultAssignee(req: any, res: any) {
    try {
      const { department, requirementType, userId } = req.body
      const result = await query(
        'UPDATE default_assignees SET department = COALESCE($1, department), requirement_type = COALESCE($2, requirement_type), user_id = COALESCE($3, user_id), updated_at = NOW() WHERE id = $4 RETURNING *',
        [department, requirementType, userId, req.params.id]
      )
      if (!result.rows[0]) {
        return res.status(404).json({ error: '默认处理人不存在' })
      }
      return res.json(result.rows[0])
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async deleteDefaultAssignee(req: any, res: any) {
    try {
      const result = await query('DELETE FROM default_assignees WHERE id = $1 RETURNING *', [req.params.id])
      if (!result.rows[0]) {
        return res.status(404).json({ error: '默认处理人不存在' })
      }
      return res.json({ message: '删除成功' })
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async listUsers(req: any, res: any) {
    try {
      const result = await query('SELECT id, email, name, role, department, is_active, created_at, updated_at FROM users ORDER BY created_at DESC')
      return res.json(result.rows)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async createUser(req: any, res: any) {
    try {
      const { email, name, password, role, department } = req.body
      if (!email || !name || !password || !role) {
        return res.status(400).json({ error: '邮箱、姓名、密码和角色不能为空' })
      }
      const passwordHash = await bcrypt.hash(password, 10)
      const result = await query(
        'INSERT INTO users (email, name, password_hash, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, department, is_active, created_at',
        [email, name, passwordHash, role, department || null]
      )

      await auditLogService.createLog({
        action: 'user_created',
        entity_type: 'user',
        entity_id: result.rows[0].id,
        user_id: req.user.id,
        details: { email, name, role, department },
      })

      return res.status(201).json(result.rows[0])
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(409).json({ error: '邮箱已存在' })
      }
      return res.status(500).json({ error: err.message })
    }
  }

  async updateUser(req: any, res: any) {
    try {
      const { email, name, role, department, isActive, password } = req.body
      const updates: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (email) { updates.push(`email = $${paramIndex++}`); params.push(email) }
      if (name) { updates.push(`name = $${paramIndex++}`); params.push(name) }
      if (role) { updates.push(`role = $${paramIndex++}`); params.push(role) }
      if (department !== undefined) { updates.push(`department = $${paramIndex++}`); params.push(department) }
      if (isActive !== undefined) { updates.push(`is_active = $${paramIndex++}`); params.push(isActive) }
      if (password) {
        const hash = await bcrypt.hash(password, 10)
        updates.push(`password_hash = $${paramIndex++}`)
        params.push(hash)
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: '没有要更新的字段' })
      }

      updates.push(`updated_at = NOW()`)
      params.push(req.params.id)

      const result = await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, name, role, department, is_active, created_at, updated_at`,
        params
      )

      if (!result.rows[0]) {
        return res.status(404).json({ error: '用户不存在' })
      }

      await auditLogService.createLog({
        action: 'user_updated',
        entity_type: 'user',
        entity_id: req.params.id,
        user_id: req.user.id,
        details: req.body,
      })

      return res.json(result.rows[0])
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async deleteUser(req: any, res: any) {
    try {
      const result = await query('DELETE FROM users WHERE id = $1 RETURNING id, email, name', [req.params.id])
      if (!result.rows[0]) {
        return res.status(404).json({ error: '用户不存在' })
      }

      await auditLogService.createLog({
        action: 'user_deleted',
        entity_type: 'user',
        entity_id: req.params.id,
        user_id: req.user.id,
        details: result.rows[0],
      })

      return res.json({ message: '删除成功' })
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async listLogs(req: any, res: any) {
    try {
      const result = await auditLogService.listLogs(req.query)
      return res.json(result)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }
}
