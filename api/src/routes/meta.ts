import { Router } from 'express';
import { getVehicles, getRoutes, getCustomers, getBatches } from '../services/dataService.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

router.get('/vehicles', cacheMiddleware(300000), (req, res) => {
  try {
    const data = getVehicles();
    res.json(data);
  } catch (error) {
    console.error('Error getting vehicles:', error);
    res.status(500).json({ error: 'Failed to get vehicles' });
  }
});

router.get('/routes', cacheMiddleware(300000), (req, res) => {
  try {
    const data = getRoutes();
    res.json(data);
  } catch (error) {
    console.error('Error getting routes:', error);
    res.status(500).json({ error: 'Failed to get routes' });
  }
});

router.get('/customers', cacheMiddleware(300000), (req, res) => {
  try {
    const data = getCustomers();
    res.json(data);
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({ error: 'Failed to get customers' });
  }
});

router.get('/batches', cacheMiddleware(60000), (req, res) => {
  try {
    const filters = req.query;
    const data = getBatches(filters);
    res.json(data);
  } catch (error) {
    console.error('Error getting batches:', error);
    res.status(500).json({ error: 'Failed to get batches' });
  }
});

export default router;
