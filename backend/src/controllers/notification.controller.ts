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

router.post('/test-score-dispute', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const { candidateName = '张三', disputeReason = '评分与预期不符' } = req.body;
    
    await notificationService.sendScoreDisputeNotification(
      'test-assessment-' + Date.now(),
      disputeReason,
      candidateName
    );
    
    successResponse(res, null, '测试评分争议通知已发送');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/tasks', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, '未登录', 401);
    }
    const tasks = await notificationService.getMyTasks(req.user.id);
    successResponse(res, tasks);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/:id/detail', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const detail = await notificationService.getNotificationDetail(id);
    if (!detail) {
      return errorResponse(res, '通知不存在', 404);
    }
    successResponse(res, detail);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.post('/:id/assign', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, '未登录', 401);
    }
    const { id } = req.params;
    const { assigneeId, deadlineHours } = req.body;
    if (!assigneeId) {
      return errorResponse(res, '请指定处理人', 400);
    }
    const task = await notificationService.assignTask(id, assigneeId, req.user.id, deadlineHours);
    successResponse(res, task, '分派成功');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.post('/tasks/:taskId/complete', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, '未登录', 401);
    }
    const { taskId } = req.params;
    const { remark } = req.body;
    await notificationService.completeTask(taskId, req.user.id, remark);
    successResponse(res, null, '任务已完成');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.post('/:id/escalate', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, '未登录', 401);
    }
    const { id } = req.params;
    await notificationService.manualEscalate(id, req.user.id);
    successResponse(res, null, '已手动升级');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

export default router;
