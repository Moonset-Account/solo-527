import { Router } from 'express';
import { notificationService } from '../services/NotificationService';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, '未登录', 401);
    }

    const { type, category, isRead, page, pageSize } = req.query;

    const result = await notificationService.getNotifications(req.user.id, {
      type: type as any,
      category: category as any,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });

    paginatedResponse(
      res,
      result.items,
      result.total,
      page ? parseInt(page as string) : 1,
      pageSize ? parseInt(pageSize as string) : 20
    );
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/unread-count', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, '未登录', 401);
    }

    const count = await notificationService.getUnreadCount(req.user.id);
    successResponse(res, count);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.put('/:id/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, '未登录', 401);
    }

    const { id } = req.params;
    await notificationService.markAsRead(id, req.user.id);
    successResponse(res, null, '已标记为已读');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.put('/read-all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, '未登录', 401);
    }

    await notificationService.markAllAsRead(req.user.id);
    successResponse(res, null, '全部标记为已读');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/escalation-rules', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const rules = await notificationService.getEscalationRules();
    successResponse(res, rules);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.post('/escalation-rules', authMiddleware, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const rule = await notificationService.createEscalationRule(req.body);
    successResponse(res, rule, '升级规则创建成功');
  } catch (error: any) {
    errorResponse(res, error.message);
  }
});

router.post('/check-escalation', authMiddleware, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await notificationService.checkAndEscalateTasks();
    successResponse(res, null, '升级检查完成');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

export default router;
