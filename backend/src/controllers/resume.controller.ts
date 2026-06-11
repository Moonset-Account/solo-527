import { Router } from 'express';
import { resumeService } from '../services/ResumeService';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { ResumeStatus } from '../entities/Resume';

const router = Router();

router.post('/submit', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, '未登录', 401);
    }

    const resume = await resumeService.submitResume({
      ...req.body,
      candidateId: req.user.id,
      candidateName: req.body.candidateName || req.user.name,
    });

    successResponse(res, resume, '简历提交成功');
  } catch (error: any) {
    errorResponse(res, error.message);
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { status, positionApplied, recruiterCycle, keyword, page, pageSize } = req.query;

    const result = await resumeService.getResumes({
      status: status as ResumeStatus,
      positionApplied: positionApplied as string,
      recruiterCycle: recruiterCycle as string,
      keyword: keyword as string,
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

router.get('/my', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, '未登录', 401);
    }

    const resumes = await resumeService.getResumesByCandidate(req.user.id);
    successResponse(res, resumes);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/stats', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const stats = await resumeService.getResumeStats();
    successResponse(res, stats);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const resume = await resumeService.getResumeById(id);
    
    if (!resume) {
      return errorResponse(res, '简历不存在', 404);
    }

    successResponse(res, resume);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.put('/:id/status', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, '未登录', 401);
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    const resume = await resumeService.updateResumeStatus(
      id,
      status,
      req.user.id,
      req.user.name,
      reason
    );

    if (!resume) {
      return errorResponse(res, '简历不存在', 404);
    }

    successResponse(res, resume, '状态更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const resume = await resumeService.updateResume(id, req.body);
    
    if (!resume) {
      return errorResponse(res, '简历不存在', 404);
    }

    successResponse(res, resume, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/:id/logs', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const logs = await resumeService.getStatusLogs(id);
    successResponse(res, logs);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/:id/records', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const records = await resumeService.getProcessingRecords(id);
    successResponse(res, records);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

export default router;
