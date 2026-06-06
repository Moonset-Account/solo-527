import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/auditService';
import { getMaterialReservations } from '../services/inventoryService';

const router = Router();

const createMaterialSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  qrCode: z.string().min(1),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().optional(),
  location: z.string().optional(),
  remarks: z.string().optional()
});

router.get('/', authenticate, async (req, res) => {
  const { status, categoryId, search } = req.query;
  
  let queryText = `
    SELECT m.*, mc.name as category_name
    FROM materials m
    JOIN material_categories mc ON m.category_id = mc.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status) {
    params.push(status);
    queryText += ` AND m.status = $${params.length}`;
  }
  
  if (categoryId) {
    params.push(categoryId);
    queryText += ` AND m.category_id = $${params.length}`;
  }
  
  if (search) {
    params.push(`%${search}%`);
    queryText += ` AND (m.name ILIKE $${params.length} OR m.qr_code ILIKE $${params.length})`;
  }
  
  queryText += ` ORDER BY m.created_at DESC`;
  
  const result = await query(queryText, params);
  res.json(result.rows);
});

router.get('/categories', authenticate, async (req, res) => {
  const result = await query('SELECT * FROM material_categories ORDER BY name');
  res.json(result.rows);
});

router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  
  const result = await query(
    `SELECT m.*, mc.name as category_name
     FROM materials m
     JOIN material_categories mc ON m.category_id = mc.id
     WHERE m.id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: '物资不存在' });
  }
  
  const reservations = await getMaterialReservations(id);
  
  res.json({ ...result.rows[0], reservations });
});

router.post('/', authenticate, requireRole(['warehouse_manager', 'admin']), async (req: AuthRequest, res) => {
  try {
    const data = createMaterialSchema.parse(req.body);
    
    const result = await query(
      `INSERT INTO materials (category_id, name, qr_code, condition, purchase_date, purchase_price, location, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [data.categoryId, data.name, data.qrCode, data.condition, data.purchaseDate || null, data.purchasePrice || null, data.location || null, data.remarks || null]
    );
    
    await createAuditLog({
      userId: req.user?.id,
      action: 'create_material',
      entityType: 'material',
      entityId: result.rows[0].id,
      newValue: result.rows[0],
      ipAddress: req.ip
    });
    
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: '二维码已存在' });
    }
    res.status(400).json({ error: '请求参数错误' });
  }
});

router.put('/:id', authenticate, requireRole(['warehouse_manager', 'admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const data = createMaterialSchema.partial().parse(req.body);
  
  const oldResult = await query('SELECT * FROM materials WHERE id = $1', [id]);
  if (oldResult.rows.length === 0) {
    return res.status(404).json({ error: '物资不存在' });
  }
  
  const result = await query(
    `UPDATE materials 
     SET category_id = COALESCE($1, category_id),
         name = COALESCE($2, name),
         qr_code = COALESCE($3, qr_code),
         condition = COALESCE($4, condition),
         purchase_date = COALESCE($5, purchase_date),
         purchase_price = COALESCE($6, purchase_price),
         location = COALESCE($7, location),
         remarks = COALESCE($8, remarks),
         updated_at = NOW()
     WHERE id = $9
     RETURNING *`,
    [data.categoryId, data.name, data.qrCode, data.condition, data.purchaseDate, data.purchasePrice, data.location, data.remarks, id]
  );
  
  await createAuditLog({
    userId: req.user?.id,
    action: 'update_material',
    entityType: 'material',
    entityId: id,
    oldValue: oldResult.rows[0],
    newValue: result.rows[0],
    ipAddress: req.ip
  });
  
  res.json(result.rows[0]);
});

router.post('/categories', authenticate, requireRole(['warehouse_manager', 'admin']), async (req: AuthRequest, res) => {
  const { name, description } = req.body;
  
  const result = await query(
    'INSERT INTO material_categories (name, description) VALUES ($1, $2) RETURNING *',
    [name, description]
  );
  
  await createAuditLog({
    userId: req.user?.id,
    action: 'create_category',
    entityType: 'material_category',
    entityId: result.rows[0].id,
    newValue: result.rows[0]
  });
  
  res.status(201).json(result.rows[0]);
});

router.get('/:id/qr', authenticate, async (req, res) => {
  const { id } = req.params;
  const result = await query('SELECT id, qr_code, name FROM materials WHERE id = $1', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: '物资不存在' });
  }
  
  res.json(result.rows[0]);
});

router.get('/qr/:qrCode', authenticate, async (req, res) => {
  const { qrCode } = req.params;
  const result = await query(
    `SELECT m.*, mc.name as category_name
     FROM materials m
     JOIN material_categories mc ON m.category_id = mc.id
     WHERE m.qr_code = $1`,
    [qrCode]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: '物资不存在' });
  }
  
  res.json(result.rows[0]);
});

export default router;
