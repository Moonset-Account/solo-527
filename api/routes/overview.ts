import express, { type Response } from 'express';
import { getSites, getMeasurements } from '../db/index.js';
import { authMiddleware, getOrganizationFilter, type AuthenticatedRequest } from '../middleware/auth.js';
import { calculateOverviewStats } from '../../src/utils/dataService.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgFilter = getOrganizationFilter(req);
    const sites = getSites(orgFilter || undefined);
    const result = getMeasurements({
      organizations: orgFilter ? [orgFilter] : undefined,
      limit: 10000,
    });

    const stats = calculateOverviewStats(sites, result.data);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Overview] Get error:', error);
    res.status(500).json({
      success: false,
      error: '获取总览数据失败',
    });
  }
});

export default router;
