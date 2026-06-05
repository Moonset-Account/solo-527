import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import * as courseService from '../services/courseService.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status as string;
    const courses = courseService.list(filters);
    res.json({ success: true, data: courses });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.post('/', authMiddleware, roleMiddleware(['manager', 'admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const course = courseService.create(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const course = courseService.getById(id);
    if (!course) {
      res.status(404).json({ success: false, error: '课程不存在' });
      return;
    }
    res.json({ success: true, data: course });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.put('/:id', authMiddleware, roleMiddleware(['manager', 'admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const course = courseService.update(id, req.body);
    if (!course) {
      res.status(404).json({ success: false, error: '课程不存在' });
      return;
    }
    res.json({ success: true, data: course });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

export default router;
