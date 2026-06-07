import express, { type Request, type Response } from 'express';
import { MOCK_SITES, MOCK_MEASUREMENTS } from '../../src/utils/mockData.js';
import { calculateOverviewStats } from '../../src/utils/dataService.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const stats = calculateOverviewStats(MOCK_SITES, MOCK_MEASUREMENTS);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取总览数据失败',
    });
  }
});

export default router;
