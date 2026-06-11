import { Router } from 'express';
import { recruitmentService } from '../services/RecruitmentService';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

const router = Router();

router.post('/cycles', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const cycle = await recruitmentService.createCycle(req.body);
    successResponse(res, cycle, '招聘周期创建成功');
  } catch (error: any) {
    errorResponse(res, error.message);
  }
});

router.get('/cycles', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    const cycles = await recruitmentService.getCycles(status as string);
    successResponse(res, cycles);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/cycles/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const cycle = await recruitmentService.getCycleById(id);
    
    if (!cycle) {
      return errorResponse(res, '招聘周期不存在', 404);
    }

    successResponse(res, cycle);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.put('/cycles/:id', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const cycle = await recruitmentService.updateCycle(id, req.body);
    
    if (!cycle) {
      return errorResponse(res, '招聘周期不存在', 404);
    }

    successResponse(res, cycle, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/records', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const { resumeId, actionType, page, pageSize } = req.query;

    const result = await recruitmentService.getAllProcessingRecords({
      resumeId: resumeId as string,
      actionType: actionType as string,
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

export default router;
