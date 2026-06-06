import { Router } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { handleCompensation, getCompensationOrders, createManualEntry, getManualEntries } from '../services/compensationService';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const { status } = req.query;
  let applicantId: string | undefined;
  
  if (req.user?.role === 'volunteer_leader') {
    applicantId = req.user.id;
  }
  
  const orders = await getCompensationOrders(status as string, applicantId);
  res.json(orders);
});

router.put('/:id/handle', authenticate, requireRole(['warehouse_manager', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body;
    
    if (!['paid', 'waived'].includes(action)) {
      return res.status(400).json({ error: '无效的操作类型' });
    }
    
    const compensation = await handleCompensation(id, action, req.user!.id, remarks);
    res.json(compensation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/manual-entries', authenticate, requireRole(['warehouse_manager', 'admin']), async (req, res) => {
  const { entryType } = req.query;
  const entries = await getManualEntries(entryType as string);
  res.json(entries);
});

router.post('/manual-entries', authenticate, requireRole(['warehouse_manager', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { entryType, entityId, entryReason, entryDetails } = req.body;
    
    const entry = await createManualEntry({
      entryType,
      entityId,
      enteredBy: req.user!.id,
      entryReason,
      entryDetails
    });
    
    res.status(201).json(entry);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
