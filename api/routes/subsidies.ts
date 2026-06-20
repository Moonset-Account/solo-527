import { Router } from 'express';
import { getSubsidies } from '../services/subsidies';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const query = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      status: req.query.status as string | undefined,
      type: req.query.type as string | undefined,
      zoneId: req.query.zoneId as string | undefined,
      period: req.query.period as string | undefined,
      keyword: req.query.keyword as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const result = await getSubsidies(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
