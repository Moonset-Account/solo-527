import { Router } from 'express';
import { getMeterZones } from '../services/meters';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const zones = await getMeterZones();
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
