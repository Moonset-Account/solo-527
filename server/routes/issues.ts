import express from 'express';
import type { Request, Response } from 'express';
import { query, getClient } from '../db/index';
import { authenticate, requireRole, checkIssueAccess } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const STATUS_FLOW: Record<string, string[]> = {
  pending_confirm: ['pending_rectify', 'false_positive', 'closed'],
  pending_rectify: ['reviewed', 'closed'],
  reviewed: ['pending_rectify', 'closed'],
  false_positive: ['closed'],
  closed: []
};

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { 
      store_id, status, category, start_date, end_date, 
      is_overdue, page = 1, limit = 20 
    } = req.query;
    
    let sql = `
      SELECT DISTINCT i.*, s.name as store_name, s.store_code,
             u1.full_name as creator_name,
             u2.full_name as assignee_name,
             (SELECT COUNT(*) FROM photos p WHERE p.issue_id = i.id) as photo_count
      FROM issues i
      LEFT JOIN stores s ON i.store_id = s.id
      LEFT JOIN users u1 ON i.created_by = u1.id
      LEFT JOIN users u2 ON i.assigned_to = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (user.role === 'store_manager') {
      sql += ` AND i.store_id = $${paramIndex++}`;
      params.push(user.store_id);
    }
    
    if (user.role === 'regional_manager' && user.region_id) {
      sql += ` AND s.region_id = $${paramIndex++}`;
      params.push(user.region_id);
    }
    
    if (store_id) {
      sql += ` AND i.store_id = $${paramIndex++}`;
      params.push(store_id);
    }
    
    if (status) {
      sql += ` AND i.status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (category) {
      sql += ` AND i.category = $${paramIndex++}`;
      params.push(category);
    }
    
    if (start_date) {
      sql += ` AND i.created_at >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      sql += ` AND i.created_at <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    if (is_overdue !== undefined) {
      sql += ` AND i.is_overdue = $${paramIndex++}`;
      params.push(is_overdue === 'true');
    }
    
    const countSql = sql.replace('SELECT DISTINCT i.*, s.name as store_name, s.store_code, u1.full_name as creator_name, u2.full_name as assignee_name, (SELECT COUNT(*) FROM photos p WHERE p.issue_id = i.id) as photo_count', 'SELECT COUNT(DISTINCT i.id)');
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);
    
    sql += ` ORDER BY i.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit as string));
    params.push((parseInt(page as string) - 1) * parseInt(limit as string));
    
    const result = await query(sql, params);
    
    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ error: '获取问题列表失败' });
  }
});

router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { store_id, start_date, end_date } = req.query;
    
    let sql = `
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE is_overdue = true AND status = 'pending_rectify') as overdue_count
      FROM issues i
      LEFT JOIN stores s ON i.store_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (user.role === 'store_manager') {
      sql += ` AND i.store_id = $${paramIndex++}`;
      params.push(user.store_id);
    }
    
    if (user.role === 'regional_manager' && user.region_id) {
      sql += ` AND s.region_id = $${paramIndex++}`;
      params.push(user.region_id);
    }
    
    if (store_id) {
      sql += ` AND i.store_id = $${paramIndex++}`;
      params.push(store_id);
    }
    
    if (start_date) {
      sql += ` AND i.created_at >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      sql += ` AND i.created_at <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    sql += ` GROUP BY status`;
    
    const result = await query(sql, params);
    
    const stats: Record<string, number> = {
      pending_confirm: 0,
      pending_rectify: 0,
      reviewed: 0,
      closed: 0,
      false_positive: 0,
      overdue: 0,
      total: 0
    };
    
    result.rows.forEach(row => {
      stats[row.status] = parseInt(row.count);
      stats.total += parseInt(row.count);
      if (row.overdue_count) stats.overdue += parseInt(row.overdue_count);
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.get('/:issueId', authenticate, checkIssueAccess, async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;
    
    const issueResult = await query(`
      SELECT i.*, s.name as store_name, s.store_code, s.address,
             u1.full_name as creator_name, u1.phone as creator_phone,
             u2.full_name as assignee_name
      FROM issues i
      LEFT JOIN stores s ON i.store_id = s.id
      LEFT JOIN users u1 ON i.created_by = u1.id
      LEFT JOIN users u2 ON i.assigned_to = u2.id
      WHERE i.id = $1
    `, [issueId]);
    
    if (issueResult.rows.length === 0) {
      return res.status(404).json({ error: '问题不存在' });
    }
    
    const photosResult = await query(`
      SELECT p.*, u.full_name as uploader_name
      FROM photos p
      LEFT JOIN users u ON p.uploaded_by = u.id
      WHERE p.issue_id = $1
      ORDER BY p.created_at DESC
    `, [issueId]);
    
    const logsResult = await query(`
      SELECT l.*, u.full_name as creator_name
      FROM issue_logs l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE l.issue_id = $1
      ORDER BY l.created_at DESC
    `, [issueId]);
    
    res.json({
      issue: issueResult.rows[0],
      photos: photosResult.rows,
      logs: logsResult.rows
    });
  } catch (error) {
    console.error('Get issue detail error:', error);
    res.status(500).json({ error: '获取问题详情失败' });
  }
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    const user = req.user!;
    const { 
      store_id, category, title, description, 
      due_date, freezer_temperature, location 
    } = req.body;
    
    if (!store_id || !category || !title) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    
    const issueId = uuidv4();
    
    const result = await client.query(`
      INSERT INTO issues (id, store_id, category, title, description, 
                         created_by, due_date, freezer_temperature, location)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [issueId, store_id, category, title, description, 
        user.id, due_date || null, freezer_temperature || null, location || null]);
    
    await client.query(`
      INSERT INTO issue_logs (issue_id, action, to_status, created_by, comment)
      VALUES ($1, $2, $3, $4, $5)
    `, [issueId, 'create', 'pending_confirm', user.id, '创建问题']);
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: '问题创建成功',
      issue: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create issue error:', error);
    res.status(500).json({ error: '创建问题失败' });
  } finally {
    client.release();
  }
});

router.put('/:issueId/status', authenticate, checkIssueAccess, async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    const user = req.user!;
    const { issueId } = req.params;
    const { status, comment, review_failure_reason, assigned_to } = req.body;
    
    const currentResult = await client.query(
      'SELECT status FROM issues WHERE id = $1',
      [issueId]
    );
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: '问题不存在' });
    }
    
    const currentStatus = currentResult.rows[0].status as string;
    const allowedTransitions = STATUS_FLOW[currentStatus] || [];
    
    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({ 
        error: `不允许从 ${currentStatus} 转换为 ${status}` 
      });
    }
    
    if (status === 'pending_rectify' && !assigned_to && currentStatus !== 'reviewed') {
      return res.status(400).json({ error: '待整改状态必须指定负责人' });
    }
    
    const updateFields: string[] = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const updateParams: any[] = [status, issueId];
    let paramIndex = 3;
    
    if (assigned_to) {
      updateFields.push(`assigned_to = $${paramIndex++}`);
      updateParams.push(assigned_to);
    }
    
    await client.query(
      `UPDATE issues SET ${updateFields.join(', ')} WHERE id = $2`,
      updateParams
    );
    
    await client.query(`
      INSERT INTO issue_logs (issue_id, action, from_status, to_status, 
                             comment, review_failure_reason, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [issueId, 'status_change', currentStatus, status, 
        comment || null, review_failure_reason || null, user.id]);
    
    await client.query('COMMIT');
    
    res.json({ message: '状态更新成功' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update status error:', error);
    res.status(500).json({ error: '状态更新失败' });
  } finally {
    client.release();
  }
});

export default router;
