import { Router, Request, Response } from 'express';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  CreateSeatSchema,
  UpdateSeatSchema,
  SeatQuerySchema,
} from '@seat-platform/shared';
import * as seatService from '../services/seatService';

const router = Router();

router.get('/', validateQuery(SeatQuerySchema), async (req: Request, res: Response) => {
  const query = req.query as unknown as Parameters<typeof seatService.listSeats>[0];
  const result = await seatService.listSeats(query);
  res.json(result);
});

router.get('/:id', async (req: Request, res: Response) => {
  const seat = await seatService.getSeatById(req.params.id);
  if (!seat) {
    return res.status(404).json({ message: '席位不存在' });
  }
  res.json(seat);
});

router.post('/', validateBody(CreateSeatSchema), async (req: Request, res: Response) => {
  const seat = await seatService.createSeat(req.body);
  res.status(201).json(seat);
});

router.put('/:id', validateBody(UpdateSeatSchema), async (req: Request, res: Response) => {
  const seat = await seatService.updateSeat(req.params.id, req.body);
  if (!seat) {
    return res.status(404).json({ message: '席位不存在' });
  }
  res.json(seat);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const deleted = await seatService.deleteSeat(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: '席位不存在' });
  }
  res.json({ success: true });
});

export default router;
