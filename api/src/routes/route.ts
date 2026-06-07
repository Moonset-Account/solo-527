import { Router } from 'express';
import { getRouteTrack } from '../services/dataService.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

router.get('/track', cacheMiddleware(60000), (req, res) => {
  try {
    const { vehicleId, batchId } = req.query;
    if (!vehicleId) {
      return res.status(400).json({ error: 'vehicleId is required' });
    }
    const data = getRouteTrack(vehicleId as string, batchId as string | undefined);
    res.json(data);
  } catch (error) {
    console.error('Error getting route track:', error);
    res.status(500).json({ error: 'Failed to get route track' });
  }
});

export default router;
