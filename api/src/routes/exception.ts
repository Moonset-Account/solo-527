import { Router } from 'express';
import { getAnomalyList, getAnomalyDetail, getDoorRecords } from '../services/dataService.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

router.get('/list', cacheMiddleware(30000), (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const filters = req.query.filters ? JSON.parse(req.query.filters as string) : undefined;
    
    const data = getAnomalyList(page, pageSize, filters);
    res.json(data);
  } catch (error) {
    console.error('Error getting anomaly list:', error);
    res.status(500).json({ error: 'Failed to get anomaly list' });
  }
});

router.get('/detail', cacheMiddleware(60000), (req, res) => {
  try {
    const { exceptionId } = req.query;
    if (!exceptionId) {
      return res.status(400).json({ error: 'exceptionId is required' });
    }
    const data = getAnomalyDetail(exceptionId as string);
    if (!data) {
      return res.status(404).json({ error: 'Anomaly not found' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error getting anomaly detail:', error);
    res.status(500).json({ error: 'Failed to get anomaly detail' });
  }
});

router.get('/doors', cacheMiddleware(60000), (req, res) => {
  try {
    const { batchId } = req.query;
    if (!batchId) {
      return res.status(400).json({ error: 'batchId is required' });
    }
    const data = getDoorRecords(batchId as string);
    res.json(data);
  } catch (error) {
    console.error('Error getting door records:', error);
    res.status(500).json({ error: 'Failed to get door records' });
  }
});

export default router;
