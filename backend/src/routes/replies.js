import { Router } from 'express';
import { auth, requireRole, WRITE_ROLES } from '../middleware/auth.js';
import {
  getReplies,
  getRepliesByPurchaseOrder,
  getRepliesByInboundOrder,
  getRepliesByException,
  createReply,
  markReplyRead,
} from '../controllers/replies.js';

const router = Router();

router.use(auth);

router.get('/', getReplies);
router.get('/purchase-order/:purchaseOrderId', getRepliesByPurchaseOrder);
router.get('/inbound-order/:inboundOrderId', getRepliesByInboundOrder);
router.get('/exception/:exceptionId', getRepliesByException);

router.post('/', createReply);
router.patch('/:id/read', markReplyRead);

export default router;
