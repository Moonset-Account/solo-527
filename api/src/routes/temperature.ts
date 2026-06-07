import { Router } from 'express';
import { getTemperatureTrend, getAnomalyStatistics, getProbeStatus } from '../services/dataService.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

router.get('/trend', cacheMiddleware(30000), (req, res) => {
  try {
    const { vehicleId, batchId } = req.query;
    const data = getTemperatureTrend(
      vehicleId as string | undefined,
      batchId as string | undefined
    );
    res.json(data);
  } catch (error) {
    console.error('Error getting temperature trend:', error);
    res.status(500).json({ error: 'Failed to get temperature trend' });
  }
});

router.get('/anomaly-statistics', cacheMiddleware(60000), (req, res) => {
  try {
    const { dimension = 'vehicle' } = req.query;
    const data = getAnomalyStatistics(dimension as string);
    res.json(data);
  } catch (error) {
    console.error('Error getting anomaly statistics:', error);
    res.status(500).json({ error: 'Failed to get anomaly statistics' });
  }
});

router.get('/probes', cacheMiddleware(300000), (req, res) => {
  try {
    const data = getProbeStatus();
    res.json(data);
  } catch (error) {
    console.error('Error getting probe status:', error);
    res.status(500).json({ error: 'Failed to get probe status' });
  }
});

export default router;
