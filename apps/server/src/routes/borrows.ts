import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { 
  createBorrowApplication, 
  approveApplication, 
  borrowMaterial, 
  returnMaterial,
  getApplicationDetails 
} from '../services/borrowService';
import { cancelInventoryReservation, checkMaterialAvailability } from '../services/inventoryService';
import { createAuditLog } from '../services/auditService';

const router = Router();

const createApplicationSchema = z.object({
  activityId: z.string().uuid(),
  materialIds: z.array(z.string().uuid()),
  expectedBorrowDate: z.string(),
  expectedReturnDate: z.string(),
  remarks: z.string().optional()
});

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const { status, applicantId, fromDate, toDate } = req.query;
  
  let queryText = `
    SELECT ba.*, a.title as activity_title, a.activity_date,
           u1.real_name as applicant_name, u2.real_name as warehouse_manager_name
    FROM borrow_applications ba
    JOIN activities a ON ba.activity_id = a.id
    JOIN users u1 ON ba.applicant_id = u1.id
    LEFT JOIN users u2 ON ba.warehouse_manager_id = u2.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status) {
    params.push(status);
    queryText += ` AND ba.status = $${params.length}`;
  }
  
  if (applicantId) {
    params.push(applicantId);
    queryText += ` AND ba.applicant_id = $${params.length}`;
  } else if (req.user?.role === 'volunteer_leader') {
    params.push(req.user.id);
    queryText += ` AND ba.applicant_id = $${params.length}`;
  }
  
  if (fromDate) {
    params.push(fromDate);
    queryText += ` AND ba.expected_borrow_date >= $${params.length}`;
  }
  
  if (toDate) {
    params.push(toDate);
    queryText += ` AND ba.expected_return_date <= $${params.length}`;
  }
  
  queryText += ` ORDER BY ba.created_at DESC`;
  
  const result = await query(queryText, params);
  res.json(result.rows);
});

router.get('/check-availability', authenticate, async (req, res) => {
  const { materialId, startDate, endDate } = req.query;
  
  if (!materialId || !startDate || !endDate) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  const available = await checkMaterialAvailability(
    materialId as string,
    startDate as string,
    endDate as string
  );
  
  res.json({ available });
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const application = await getApplicationDetails(req.params.id);
    res.json(application);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/', authenticate, requireRole(['volunteer_leader', 'admin']), async (req: AuthRequest, res) => {
  try {
    const data = createApplicationSchema.parse(req.body);
    
    const application = await createBorrowApplication(
      { ...data, applicantId: req.user!.id },
      req.user!.id
    );
    
    res.status(201).json(application);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/approve', authenticate, requireRole(['warehouse_manager', 'admin']), async (req: AuthRequest, res) => {
  try {
    const application = await approveApplication(req.params.id, req.user!.id);
    res.json(application);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/reject', authenticate, requireRole(['warehouse_manager', 'admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  await cancelInventoryReservation(id);
  
  const result = await query(
    `UPDATE borrow_applications 
     SET status = 'rejected', remarks = COALESCE($1, remarks), updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [reason, id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  await createAuditLog({
    userId: req.user?.id,
    action: 'reject_application',
    entityType: 'borrow_application',
    entityId: id,
    newValue: { status: 'rejected', reason }
  });
  
  res.json(result.rows[0]);
});

router.put('/:id/cancel', authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  
  const appResult = await query('SELECT * FROM borrow_applications WHERE id = $1', [id]);
  if (appResult.rows.length === 0) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  const application = appResult.rows[0];
  
  if (req.user?.role !== 'admin' && application.applicant_id !== req.user?.id) {
    return res.status(403).json({ error: '权限不足' });
  }
  
  await cancelInventoryReservation(id);
  
  const result = await query(
    `UPDATE borrow_applications SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  
  await createAuditLog({
    userId: req.user?.id,
    action: 'cancel_application',
    entityType: 'borrow_application',
    entityId: id,
    newValue: { status: 'cancelled' }
  });
  
  res.json(result.rows[0]);
});

const borrowSchema = z.object({
  applicationId: z.string().uuid(),
  materialId: z.string().uuid(),
  qrCode: z.string(),
  borrowCondition: z.enum(['excellent', 'good', 'fair', 'poor'])
});

router.post('/borrow', authenticate, requireRole(['warehouse_manager', 'admin']), async (req: AuthRequest, res) => {
  try {
    const data = borrowSchema.parse(req.body);
    
    const borrowItem = await borrowMaterial({
      ...data,
      warehouseManagerId: req.user!.id
    });
    
    res.json(borrowItem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

const returnSchema = z.object({
  applicationId: z.string().uuid(),
  materialId: z.string().uuid(),
  qrCode: z.string(),
  returnCondition: z.enum(['excellent', 'good', 'fair', 'poor']),
  damageDescription: z.string().optional(),
  missingParts: z.string().optional()
});

router.post('/return', authenticate, requireRole(['warehouse_manager', 'admin']), async (req: AuthRequest, res) => {
  try {
    const data = returnSchema.parse(req.body);
    
    const borrowItem = await returnMaterial({
      ...data,
      warehouseManagerId: req.user!.id
    });
    
    res.json(borrowItem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
