import { Router, type Request, type Response } from 'express';
import { INDICATORS, WATER_QUALITY_GRADES, RIVER_SECTIONS, ORGANIZATIONS } from '../../src/utils/constants.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        indicators: INDICATORS,
        waterQualityGrades: WATER_QUALITY_GRADES,
        riverSections: RIVER_SECTIONS,
        organizations: ORGANIZATIONS,
      },
    });
  } catch (error) {
    console.error('[DataDict] Get error:', error);
    res.status(500).json({
      success: false,
      error: '获取数据字典失败',
    });
  }
});

export default router;
