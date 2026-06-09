import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import AdminService from '../services/AdminService.js';
import type { Milestone } from '#shared/types';

const router = Router();

router.get('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const list = AdminService.listMilestones(req.query.projectId as string | undefined);
    res.json({ success: true, data: list });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '获取里程碑列表失败' });
  }
});

const createSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  dueDate: z.string().nullable().optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'at_risk', 'cancelled']).default('planned'),
  actionItemIds: z.array(z.string()).default([]),
});

router.post('/', authenticateToken, requireRole('manager'), (req: Request, res: Response): void => {
  try {
    const parsed = createSchema.parse(req.body);
    const milestone = AdminService.createMilestone(parsed as unknown as Omit<Milestone, 'id' | 'actionItemIds' | 'createdAt'> & { actionItemIds?: string[] });
    res.json({ success: true, data: milestone });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: '参数错误', details: err.errors });
    } else {
      res.locals.errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: '创建里程碑失败' });
    }
  }
});

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'at_risk', 'cancelled']).optional(),
  actionItemIds: z.array(z.string()).optional(),
});

router.patch('/:id', authenticateToken, requireRole('manager'), (req: Request, res: Response): void => {
  try {
    const parsed = updateSchema.parse(req.body);
    const updated = AdminService.updateMilestone(req.params.id, parsed);
    if (!updated) {
      res.status(404).json({ success: false, error: '里程碑不存在' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: '参数错误', details: err.errors });
    } else {
      res.locals.errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: '更新里程碑失败' });
    }
  }
});

router.delete('/:id', authenticateToken, requireRole('manager'), (req: Request, res: Response): void => {
  try {
    const ok = AdminService.deleteMilestone(req.params.id);
    res.json({ success: ok });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '删除里程碑失败' });
  }
});

export default router;
