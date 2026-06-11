import { Router } from 'express';
import { assessmentService } from '../services/AssessmentService';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

const router = Router();

router.post('/', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const assessment = await assessmentService.createAssessment(req.body);
    successResponse(res, assessment, '测评创建成功');
  } catch (error: any) {
    errorResponse(res, error.message);
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { resumeId, status, hasDispute, page, pageSize } = req.query;

    const result = await assessmentService.getAssessments({
      resumeId: resumeId as string,
      status: status as string,
      hasDispute: hasDispute ? hasDispute === 'true' : undefined,
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

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const assessment = await assessmentService.getAssessmentById(id);
    
    if (!assessment) {
      return errorResponse(res, '测评不存在', 404);
    }

    successResponse(res, assessment);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.put('/:id/start', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const assessment = await assessmentService.startAssessment(id);
    
    if (!assessment) {
      return errorResponse(res, '测评不存在', 404);
    }

    successResponse(res, assessment, '测评已开始');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.put('/:id/submit', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    const assessment = await assessmentService.submitAssessment(id, answers);
    
    if (!assessment) {
      return errorResponse(res, '测评不存在', 404);
    }

    successResponse(res, assessment, '测评提交成功');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.put('/:id/grade', authMiddleware, requireRole('admin', 'hr', 'interviewer'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, '未登录', 401);
    }

    const { id } = req.params;
    const assessment = await assessmentService.gradeAssessment({
      id,
      ...req.body,
      gradedById: req.user.id,
      gradedByName: req.user.name,
    });
    
    if (!assessment) {
      return errorResponse(res, '测评不存在', 404);
    }

    successResponse(res, assessment, '评分完成');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.post('/:id/dispute', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const assessment = await assessmentService.raiseDispute(id, reason);
    
    if (!assessment) {
      return errorResponse(res, '测评不存在', 404);
    }

    successResponse(res, assessment, '争议已提交');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.post('/:id/dispute/resolve', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { resolved, resolution } = req.body;

    const assessment = await assessmentService.resolveDispute(id, resolved, resolution);
    
    if (!assessment) {
      return errorResponse(res, '测评不存在', 404);
    }

    successResponse(res, assessment, '争议已处理');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.post('/criteria', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const criterion = await assessmentService.createScoringCriterion(req.body);
    successResponse(res, criterion, '评分标准创建成功');
  } catch (error: any) {
    errorResponse(res, error.message);
  }
});

router.get('/criteria/list', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { category } = req.query;
    const criteria = await assessmentService.getScoringCriteria(category as string);
    successResponse(res, criteria);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/criteria/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const criterion = await assessmentService.getScoringCriterionById(id);
    
    if (!criterion) {
      return errorResponse(res, '评分标准不存在', 404);
    }

    successResponse(res, criterion);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.put('/criteria/:id', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const criterion = await assessmentService.updateScoringCriterion(id, req.body);
    
    if (!criterion) {
      return errorResponse(res, '评分标准不存在', 404);
    }

    successResponse(res, criterion, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

export default router;
