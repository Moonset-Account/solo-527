import { Router } from 'express';
import { getDashboardStats, getTrendData } from '../services/dashboard';

const router = Router();

router.get('/stats', async (_req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const trends = await getTrendData(days);
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
