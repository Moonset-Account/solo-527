import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import AdminService from '../services/AdminService.js';
import MonitorService from '../services/MonitorService.js';
import type { Role, MaskingRule } from '#shared/types';

const router = Router();

router.get('/users', authenticateToken, requireRole('admin'), (req: Request, res: Response): void => {
  try {
    const users = AdminService.listUsers({
      role: req.query.role as Role | undefined,
      search: req.query.search as string | undefined,
    });
    res.json({ success: true, data: users });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '获取用户列表失败' });
  }
});

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'manager', 'reviewer', 'member']),
  password: z.string().min(6).optional(),
});

router.post('/users', authenticateToken, requireRole('admin'), (req: Request, res: Response): void => {
  try {
    const parsed = createUserSchema.parse(req.body);
    const input: { email: string; name: string; role: Role; password?: string } = {
      email: parsed.email,
      name: parsed.name,
      role: parsed.role,
      password: parsed.password,
    };
    const user = AdminService.createUser(input);
    res.json({ success: true, data: user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: '参数错误', details: err.errors });
    } else {
      res.locals.errorMessage = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, error: err instanceof Error ? err.message : '创建用户失败' });
    }
  }
});

const roleSchema = z.object({
  role: z.enum(['admin', 'manager', 'reviewer', 'member']),
});

router.patch('/users/:id/role', authenticateToken, requireRole('admin'), (req: Request, res: Response): void => {
  try {
    const parsed = roleSchema.parse(req.body);
    const user = AdminService.setRole(req.params.id, parsed.role);
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: '参数错误', details: err.errors });
    } else {
      res.locals.errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: '设置角色失败' });
    }
  }
});

router.delete('/users/:id', authenticateToken, requireRole('admin'), (req: Request, res: Response): void => {
  try {
    const ok = AdminService.deleteUser(req.params.id);
    res.json({ success: ok });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '删除用户失败' });
  }
});

router.get('/masking-rules', authenticateToken, requireRole('admin'), (_req: Request, res: Response): void => {
  try {
    const rules = AdminService.listMaskingRules();
    res.json({ success: true, data: rules });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '获取脱敏规则失败' });
  }
});

const createRuleSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['regex', 'keyword']),
  pattern: z.string().min(1),
  replacement: z.string().min(1),
  enabled: z.boolean().default(true),
});

router.post('/masking-rules', authenticateToken, requireRole('admin'), (req: Request, res: Response): void => {
  try {
    const parsed = createRuleSchema.parse(req.body);
    const input: { name: string; type: 'regex' | 'keyword'; pattern: string; replacement: string; enabled: boolean } = {
      name: parsed.name,
      type: parsed.type,
      pattern: parsed.pattern,
      replacement: parsed.replacement,
      enabled: parsed.enabled,
    };
    const rule = AdminService.createMaskingRule(input);
    res.json({ success: true, data: rule });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: '参数错误', details: err.errors });
    } else {
      res.locals.errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: '创建脱敏规则失败' });
    }
  }
});

const updateRuleSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['regex', 'keyword']).optional(),
  pattern: z.string().optional(),
  replacement: z.string().optional(),
  enabled: z.boolean().optional(),
});

router.put('/masking-rules/:id', authenticateToken, requireRole('admin'), (req: Request, res: Response): void => {
  try {
    const parsed = updateRuleSchema.parse(req.body);
    const rule = AdminService.updateMaskingRule(req.params.id, parsed as Partial<Omit<MaskingRule, 'id'>>);
    if (!rule) {
      res.status(404).json({ success: false, error: '脱敏规则不存在' });
      return;
    }
    res.json({ success: true, data: rule });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: '参数错误', details: err.errors });
    } else {
      res.locals.errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: '更新脱敏规则失败' });
    }
  }
});

router.delete('/masking-rules/:id', authenticateToken, requireRole('admin'), (req: Request, res: Response): void => {
  try {
    const ok = AdminService.deleteMaskingRule(req.params.id);
    res.json({ success: ok });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '删除脱敏规则失败' });
  }
});

router.get('/monitor/api-logs', authenticateToken, requireRole('admin'), (req: Request, res: Response): void => {
  try {
    const stats = MonitorService.getStats({
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    });
    const logs = MonitorService.queryLogs({
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      endpoint: req.query.endpoint as string | undefined,
      limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined,
    });
    res.json({ success: true, data: { stats, logs } });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: '获取监控日志失败' });
  }
});

export default router;
