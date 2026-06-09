import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import ActionItemService from '../services/ActionItemService.js';
import type { ActionItemStatus } from '#shared/types';

const router = Router();

router.get('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const items = ActionItemService.list({
      meetingId: req.query.meetingId as string | undefined,
      status: req.query.status as ActionItemStatus | undefined,
      assignee: req.query.assignee as string | undefined,
      milestoneId: req.query.milestoneId as string | undefined,
    });
    res.json({ success: true, data: items });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '获取行动项列表失败' });
  }
});

router.get('/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const item = ActionItemService.getById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, error: '行动项不存在' });
      return;
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '获取行动项详情失败' });
  }
});

const patchSchema = z.object({
  content: z.string().optional(),
  assignee: z.string().nullable().optional(),
  assigneeStatus: z.enum(['confirmed', 'pending_assignment', 'ai_suggested']).optional(),
  dueDate: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  milestoneId: z.string().nullable().optional(),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
  status: z.enum(['draft', 'pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled']).optional(),
  remarks: z.string().optional(),
  remark: z.string().optional(),
});

router.patch('/:id', authenticateToken, requireRole('reviewer'), (req: Request, res: Response): void => {
  try {
    const parsed = patchSchema.parse(req.body);
    const operator = {
      id: req.user!.userId,
      email: req.user!.email,
      name: req.user!.name,
      role: req.user!.role,
    };
    const updated = ActionItemService.patch(req.params.id, parsed, operator, parsed.remark);
    if (!updated) {
      res.status(404).json({ success: false, error: '行动项不存在' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: '参数错误', details: err.errors });
    } else {
      res.locals.errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: '更新行动项失败' });
    }
  }
});

const batchConfirmSchema = z.object({
  ids: z.array(z.string()).min(1),
});

router.post('/batch-confirm', authenticateToken, requireRole('manager'), (req: Request, res: Response): void => {
  try {
    const parsed = batchConfirmSchema.parse(req.body);
    const operator = {
      id: req.user!.userId,
      email: req.user!.email,
      name: req.user!.name,
      role: req.user!.role,
    };
    const items = ActionItemService.batchConfirm(parsed.ids, operator);
    res.json({ success: true, data: items, count: items.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: '参数错误', details: err.errors });
    } else {
      res.locals.errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: '批量确认失败' });
    }
  }
});

const batchAssignSchema = z.object({
  ids: z.array(z.string()).min(1),
  assignee: z.string().min(1),
});

router.post('/batch-assign', authenticateToken, requireRole('manager'), (req: Request, res: Response): void => {
  try {
    const parsed = batchAssignSchema.parse(req.body);
    const operator = {
      id: req.user!.userId,
      email: req.user!.email,
      name: req.user!.name,
      role: req.user!.role,
    };
    const items = ActionItemService.batchAssign(parsed.ids, parsed.assignee, operator);
    res.json({ success: true, data: items, count: items.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: '参数错误', details: err.errors });
    } else {
      res.locals.errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: '批量分配失败' });
    }
  }
});

router.get('/:id/history', authenticateToken, (req: Request, res: Response): void => {
  try {
    const history = ActionItemService.getHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '获取历史版本失败' });
  }
});

const rollbackSchema = z.object({
  version: z.number().int().min(1),
});

router.post('/:id/rollback', authenticateToken, requireRole('reviewer'), (req: Request, res: Response): void => {
  try {
    const parsed = rollbackSchema.parse(req.body);
    const operator = {
      id: req.user!.userId,
      email: req.user!.email,
      name: req.user!.name,
      role: req.user!.role,
    };
    const item = ActionItemService.rollback(req.params.id, parsed.version, operator);
    if (!item) {
      res.status(404).json({ success: false, error: '行动项或版本不存在' });
      return;
    }
    res.json({ success: true, data: item });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: '参数错误', details: err.errors });
    } else {
      res.locals.errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: '回滚失败' });
    }
  }
});

export default router;
