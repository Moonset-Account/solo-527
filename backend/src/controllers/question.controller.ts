import { Router } from 'express';
import { questionService } from '../services/QuestionService';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

const router = Router();

router.post('/questions', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, '未登录', 401);
    }

    const question = await questionService.createQuestion({
      ...req.body,
      createdBy: req.user.id,
    });

    successResponse(res, question, '题目创建成功');
  } catch (error: any) {
    errorResponse(res, error.message);
  }
});

router.get('/questions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { category, difficulty, type, keyword, page, pageSize } = req.query;

    const result = await questionService.getQuestions({
      category: category as string,
      difficulty: difficulty as any,
      type: type as any,
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

router.get('/questions/categories', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const categories = await questionService.getCategories();
    successResponse(res, categories);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/questions/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const question = await questionService.getQuestionById(id);
    
    if (!question) {
      return errorResponse(res, '题目不存在', 404);
    }

    successResponse(res, question);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.put('/questions/:id', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const question = await questionService.updateQuestion(id, req.body);
    
    if (!question) {
      return errorResponse(res, '题目不存在', 404);
    }

    successResponse(res, question, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.delete('/questions/:id', authMiddleware, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await questionService.deleteQuestion(id);
    
    if (!result) {
      return errorResponse(res, '题目不存在', 404);
    }

    successResponse(res, null, '删除成功');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.post('/banks', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const bank = await questionService.createQuestionBank(req.body);
    successResponse(res, bank, '题库创建成功');
  } catch (error: any) {
    errorResponse(res, error.message);
  }
});

router.get('/banks', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { category, page, pageSize } = req.query;

    const result = await questionService.getQuestionBanks({
      category: category as string,
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

router.get('/banks/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const bank = await questionService.getQuestionBankById(id);
    
    if (!bank) {
      return errorResponse(res, '题库不存在', 404);
    }

    successResponse(res, bank);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/banks/:id/questions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const questions = await questionService.getQuestionsByBank(id);
    successResponse(res, questions);
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

router.put('/banks/:id', authMiddleware, requireRole('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const bank = await questionService.updateQuestionBank(id, req.body);
    
    if (!bank) {
      return errorResponse(res, '题库不存在', 404);
    }

    successResponse(res, bank, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, 500);
  }
});

export default router;
