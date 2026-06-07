import { Router } from 'express';
import { getCompareMetrics } from '../services/dataService.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

router.get('/metrics', cacheMiddleware(60000), (req, res) => {
  try {
    const { dimension, ids, metrics } = req.query;
    if (!dimension || !ids) {
      return res.status(400).json({ error: 'dimension and ids are required' });
    }
    const idList = (ids as string).split(',');
    const metricList = metrics ? (metrics as string).split(',') : [];
    
    const data = getCompareMetrics(dimension as string, idList, metricList);
    res.json(data);
  } catch (error) {
    console.error('Error getting compare metrics:', error);
    res.status(500).json({ error: 'Failed to get compare metrics' });
  }
});

export default router;
