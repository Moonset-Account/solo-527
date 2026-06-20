import { Router } from 'express';
import { getMeterZones } from '../services/meters';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const query = {
      status: req.query.status as string | undefined,
      keyword: req.query.keyword as string | undefined,
    };
    const zones = await getMeterZones(query);
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
