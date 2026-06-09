import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { extractionLimiter } from '../middleware/monitor.js';
import MeetingService from '../services/MeetingService.js';
import type { TranscriptSegment, Speaker, Meeting } from '#shared/types';

const router = Router();

const createMeetingSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  projectId: z.string().min(1),
  speakers: z.array(z.unknown() as unknown as z.ZodType<Speaker>).default([]),
  topics: z.array(z.string()).default([]),
  transcript: z.array(z.unknown() as unknown as z.ZodType<TranscriptSegment>).default([]),
}).required({ title: true, date: true, projectId: true });

router.get('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const list = MeetingService.list({
      projectId: req.query.projectId as string | undefined,
      status: req.query.status as Meeting['status'] | undefined,
      createdBy: req.query.createdBy as string | undefined,
    });
    res.json({ success: true, data: list });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '获取会议列表失败' });
  }
});

router.get('/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const meeting = MeetingService.getById(req.params.id);
    if (!meeting) {
      res.status(404).json({ success: false, error: '会议不存在' });
      return;
    }
    res.json({ success: true, data: meeting });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '获取会议详情失败' });
  }
});

router.post('/', authenticateToken, requireRole('manager'), (req: Request, res: Response): void => {
  try {
    const parsed = createMeetingSchema.parse(req.body);
    const meeting = MeetingService.create({
      title: parsed.title,
      date: parsed.date,
      projectId: parsed.projectId,
      speakers: parsed.speakers as Speaker[],
      topics: parsed.topics,
      transcript: parsed.transcript as TranscriptSegment[],
      createdBy: req.user!.userId,
    });
    res.json({ success: true, data: meeting });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: '参数错误', details: err.errors });
    } else {
      res.locals.errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: '创建会议失败' });
    }
  }
});

router.delete('/:id', authenticateToken, requireRole('manager'), (req: Request, res: Response): void => {
  try {
    const ok = MeetingService.delete(req.params.id);
    res.json({ success: ok });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '删除会议失败' });
  }
});

const importSchema = z.object({
  transcript: z.array(z.unknown() as unknown as z.ZodType<TranscriptSegment>),
  applyMasking: z.boolean().optional(),
});

router.post('/:id/transcript', authenticateToken, requireRole('manager'), (req: Request, res: Response): void => {
  try {
    const parsed = importSchema.parse(req.body);
    const segments = MeetingService.importTranscript(req.params.id, {
      transcript: parsed.transcript,
      applyMasking: parsed.applyMasking ?? true,
    });
    res.json({ success: true, data: segments });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: '参数错误', details: err.errors });
    } else {
      res.locals.errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: '导入转写失败' });
    }
  }
});

router.post('/:id/extract', authenticateToken, requireRole('manager'), extractionLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await MeetingService.triggerExtraction(req.params.id, req.user!.userId);
    if (res.locals) {
      // 如需记录具体抽取的 token，可以在 service 中返回并设置
    }
    res.json({ success: true, data: items });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : '抽取行动项失败' });
  }
});

router.get('/:id/action-items', authenticateToken, (req: Request, res: Response): void => {
  try {
    const items = MeetingService.getActionItems(req.params.id);
    res.json({ success: true, data: items });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '获取行动项列表失败' });
  }
});

export default router;
