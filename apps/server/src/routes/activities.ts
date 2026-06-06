import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/auditService';

const router = Router();

const createActivitySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  activityDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().min(1)
});

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const { startDate, endDate, status, leaderId } = req.query;
  
  let queryText = `
    SELECT a.*, u.real_name as leader_name
    FROM activities a
    JOIN users u ON a.leader_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (startDate) {
    params.push(startDate);
    queryText += ` AND a.activity_date >= $${params.length}`;
  }
  
  if (endDate) {
    params.push(endDate);
    queryText += ` AND a.activity_date <= $${params.length}`;
  }
  
  if (status) {
    params.push(status);
    queryText += ` AND a.status = $${params.length}`;
  }
  
  if (leaderId) {
    params.push(leaderId);
    queryText += ` AND a.leader_id = $${params.length}`;
  }
  
  queryText += ` ORDER BY a.activity_date DESC`;
  
  const result = await query(queryText, params);
  res.json(result.rows);
});

router.get('/calendar', authenticate, async (req, res) => {
  const { month, year } = req.query;
  
  let queryText = `
    SELECT a.id, a.title, a.activity_date, a.start_time, a.end_time, 
           a.location, a.status, u.real_name as leader_name
    FROM activities a
    JOIN users u ON a.leader_id = u.id
  `;
  const params: any[] = [];
  
  if (month && year) {
    params.push(year, month);
    queryText += ` WHERE EXTRACT(YEAR FROM a.activity_date) = $1 AND EXTRACT(MONTH FROM a.activity_date) = $2`;
  }
  
  queryText += ` ORDER BY a.activity_date`;
  
  const result = await query(queryText, params);
  res.json(result.rows);
});

router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  
  const result = await query(
    `SELECT a.*, u.real_name as leader_name, u.phone as leader_phone, u.email as leader_email
     FROM activities a
     JOIN users u ON a.leader_id = u.id
     WHERE a.id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: '活动不存在' });
  }
  
  res.json(result.rows[0]);
});

router.post('/', authenticate, requireRole(['volunteer_leader', 'admin']), async (req: AuthRequest, res) => {
  try {
    const data = createActivitySchema.parse(req.body);
    
    const result = await query(
      `INSERT INTO activities (title, description, activity_date, start_time, end_time, location, leader_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.title, data.description || null, data.activityDate, data.startTime, data.endTime, data.location, req.user?.id]
    );
    
    await createAuditLog({
      userId: req.user?.id,
      action: 'create_activity',
      entityType: 'activity',
      entityId: result.rows[0].id,
      newValue: result.rows[0],
      ipAddress: req.ip
    });
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: '请求参数错误' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const data = createActivitySchema.partial().parse(req.body);
  
  const oldResult = await query('SELECT * FROM activities WHERE id = $1', [id]);
  if (oldResult.rows.length === 0) {
    return res.status(404).json({ error: '活动不存在' });
  }
  
  const activity = oldResult.rows[0];
  
  if (req.user?.role !== 'admin' && activity.leader_id !== req.user?.id) {
    return res.status(403).json({ error: '权限不足' });
  }
  
  const result = await query(
    `UPDATE activities 
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         activity_date = COALESCE($3, activity_date),
         start_time = COALESCE($4, start_time),
         end_time = COALESCE($5, end_time),
         location = COALESCE($6, location),
         updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [data.title, data.description, data.activityDate, data.startTime, data.endTime, data.location, id]
  );
  
  await createAuditLog({
    userId: req.user?.id,
    action: 'update_activity',
    entityType: 'activity',
    entityId: id,
    oldValue: activity,
    newValue: result.rows[0],
    ipAddress: req.ip
  });
  
  res.json(result.rows[0]);
});

router.put('/:id/status', authenticate, requireRole(['warehouse_manager', 'admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const oldResult = await query('SELECT * FROM activities WHERE id = $1', [id]);
  if (oldResult.rows.length === 0) {
    return res.status(404).json({ error: '活动不存在' });
  }
  
  const result = await query(
    `UPDATE activities SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  
  await createAuditLog({
    userId: req.user?.id,
    action: 'update_activity_status',
    entityType: 'activity',
    entityId: id,
    oldValue: { status: oldResult.rows[0].status },
    newValue: { status },
    ipAddress: req.ip
  });
  
  res.json(result.rows[0]);
});

export default router;
