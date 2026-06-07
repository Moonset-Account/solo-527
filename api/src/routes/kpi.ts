import { Router } from 'express';
import { getKPIData } from '../services/dataService.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

router.get('/overview', cacheMiddleware(60000), (req, res) => {
  try {
    const data = getKPIData();
    res.json(data);
  } catch (error) {
    console.error('Error getting KPI data:', error);
    res.status(500).json({ error: 'Failed to get KPI data' });
  }
});

export default router;
