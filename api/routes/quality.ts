import express, { type Request, type Response } from 'express';
import { MOCK_SITES, MOCK_MEASUREMENTS } from '../../src/utils/mockData.js';
import { runQualityCheck } from '../../src/utils/dataService.js';

const router = express.Router();

router.get('/check', (req: Request, res: Response) => {
  try {
    const result = runQualityCheck(MOCK_MEASUREMENTS, MOCK_SITES);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '质量检查失败',
    });
  }
});

export default router;
