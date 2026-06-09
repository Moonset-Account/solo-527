import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import TrainingService from '../services/TrainingService.js';

const router = Router();

router.get('/versions', authenticateToken, requireRole('admin'), (_req: Request, res: Response): void => {
  try {
    const versions = TrainingService.listVersions();
    res.json({ success: true, data: versions });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '获取模型版本列表失败' });
  }
});

router.patch('/versions/:id/activate', authenticateToken, requireRole('admin'), (req: Request, res: Response): void => {
  try {
    const updated = TrainingService.activate(req.params.id);
    if (!updated) {
      res.status(404).json({ success: false, error: '模型版本不存在' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: err instanceof Error ? err.message : '激活模型失败' });
  }
});

const ftSchema = z.object({
  name: z.string().optional(),
  baseModel: z.string().optional(),
  useRealOpenAI: z.boolean().optional(),
});

router.post('/fine-tune', authenticateToken, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = ftSchema.parse(req.body ?? {});
    const version = await TrainingService.startFineTune(parsed);
    res.json({ success: true, data: version });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: '参数错误', details: err.errors });
    } else {
      res.locals.errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : '发起微调失败' });
    }
  }
});

export default router;
