import express, { type Response } from 'express';
import { getDB } from '../db/index.js';
import { authMiddleware, getOrganizationFilter, type AuthenticatedRequest } from '../middleware/auth.js';
import { runQualityCheck } from '../../src/utils/dataService.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgFilter = getOrganizationFilter(req);
    const sites = await getDB().getSites(orgFilter || undefined);
    const result = await getDB().getMeasurements({
      organizations: orgFilter ? [orgFilter] : undefined,
      limit: 10000,
    });

    const qualityResult = runQualityCheck(result.data, sites);

    res.json({
      success: true,
      data: qualityResult,
    });
  } catch (error) {
    console.error('[Quality] Get error:', error);
    res.status(500).json({
      success: false,
      error: '获取质量检查数据失败',
    });
  }
});

export default router;
