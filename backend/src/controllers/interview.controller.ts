import { Router } from 'express';
import { interviewService } from '../services/InterviewService';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

const router = Router();

router.post('/', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const interview = await interviewService.createInterview(req.body);
    successResponse(res, interview, '面试安排成功');
  } catch (error: any) {
    errorResponse(res, error.message);
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { interviewerId, status, dateFrom, dateTo, page, pageSize } = req.query;

    const result = await interviewService.getInterviews({
      interviewerId: interviewerId as string,
      status: status as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
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

router.get('/quality-stats', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const stats = await interviewService.getInterviewQualityStats();
    successResponse(res, stats);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/my', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, '未登录', 401);
    }

    const interviews = await interviewService.getInterviewerInterviews(req.user.id);
    successResponse(res, interviews);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const interview = await interviewService.getInterviewById(id);
    
    if (!interview) {
      return errorResponse(res, '面试不存在', 404);
    }

    successResponse(res, interview);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.put('/:id', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const interview = await interviewService.updateInterview(id, req.body);
    
    if (!interview) {
      return errorResponse(res, '面试不存在', 404);
    }

    successResponse(res, interview, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.put('/:id/complete', authMiddleware, requireRole('admin', 'hr', 'interviewer'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const interview = await interviewService.completeInterview({
      id,
      ...req.body,
    });
    
    if (!interview) {
      return errorResponse(res, '面试不存在', 404);
    }

    successResponse(res, interview, '面试已完成');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/schedules/:interviewerId/:date', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { interviewerId, date } = req.params;
    const schedule = await interviewService.getInterviewerSchedule(interviewerId, new Date(date));
    successResponse(res, schedule);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.post('/schedules', authMiddleware, requireRole('admin', 'hr', 'interviewer'), async (req: AuthRequest, res) => {
  try {
    const schedule = await interviewService.createOrUpdateSchedule(req.body);
    successResponse(res, schedule, '档期更新成功');
  } catch (error: any) {
    errorResponse(res, error.message);
  }
});

export default router;
