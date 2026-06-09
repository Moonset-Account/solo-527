import { Router, type Request, type Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import EvaluationService from '../services/EvaluationService.js';

const router = Router();

router.get('/report', authenticateToken, requireRole('reviewer'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const report = await EvaluationService.generateReport();
    res.json({ success: true, data: report });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '生成评估报告失败' });
  }
});

router.post('/export-jsonl', authenticateToken, requireRole('reviewer'), (req: Request, res: Response): void => {
  try {
    const { samples, count } = EvaluationService.exportJsonl({
      minQuality: typeof req.body?.minQuality === 'number' ? req.body.minQuality : undefined,
    });
    const lines = EvaluationService.toJsonlLines(samples);
    res.setHeader('Content-Type', 'application/jsonl; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="fine-tune-samples-${Date.now()}.jsonl"`);
    res.send(lines);
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '导出 JSONL 失败' });
  }
});

export default router;
