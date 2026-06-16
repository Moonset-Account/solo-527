import { Router } from 'express';
import { auth, requireRole, ROLE, ALL_INTERNAL_ROLES } from '../middleware/auth.js';
import {
  getOverview,
  getSupplierPerformance,
  getExpiryAnalysis,
  getExceptionEfficiency,
  getDailyTrend,
} from '../controllers/statistics.js';

const router = Router();

router.use(auth);

router.get('/overview', requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER), getOverview);
router.get('/supplier-performance', requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER), getSupplierPerformance);
router.get('/expiry-analysis', requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER), getExpiryAnalysis);
router.get('/exception-efficiency', requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER), getExceptionEfficiency);
router.get('/daily-trend', requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER), getDailyTrend);

export default router;
