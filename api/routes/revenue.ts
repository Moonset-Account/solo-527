import { Router } from 'express';
import { getRevenueSummary, getRevenueDetails, getGapAnalysis } from '../services/revenue';

const router = Router();

router.get('/summary', async (_req, res) => {
  try {
    const summary = await getRevenueSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/details', async (req, res) => {
  try {
    const query = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      zoneId: req.query.zoneId as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      hasGap: req.query.hasGap === 'true' ? true : req.query.hasGap === 'false' ? false : undefined,
    };
    const result = await getRevenueDetails(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/gaps', async (_req, res) => {
  try {
    const gaps = await getGapAnalysis();
    res.json(gaps);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
