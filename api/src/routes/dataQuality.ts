import { Router } from 'express';
import { getDataQualityReport } from '../services/dataService.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

router.get('/report', cacheMiddleware(30000), (req, res) => {
  try {
    const data = getDataQualityReport();
    res.json(data);
  } catch (error) {
    console.error('Error getting data quality report:', error);
    res.status(500).json({ error: 'Failed to get data quality report' });
  }
});

export default router;
