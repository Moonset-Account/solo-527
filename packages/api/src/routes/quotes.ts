import { Router, Request, Response } from 'express';
import { QuoteStatus, ApiResponse } from '@app/shared';
import {
  createQuote,
  updateQuote,
  selectQuote,
  compareQuotesByPR,
  getPriceFluctuations,
  listQuotes,
  getQuoteHistory
} from '../services/quoteService.js';

export const quoteRouter = Router();

const mockUser = { id: 'user-002', name: '李供应商', role: 'supplier' };

quoteRouter.post('/', async (req: Request, res: Response) => {
  const result = await createQuote(
    req.body,
    mockUser.id,
    mockUser.name
  );
  res.status(result.success ? 200 : 400).json(result);
});

quoteRouter.get('/', async (req: Request, res: Response) => {
  const query = {
    purchaseRequestId: req.query.purchaseRequestId as string,
    supplierId: req.query.supplierId as string,
    status: req.query.status as QuoteStatus,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20
  };
  const result = await listQuotes(query);
  res.json(result);
});

quoteRouter.get('/compare/:purchaseRequestId', async (req: Request, res: Response) => {
  const result = await compareQuotesByPR(req.params.purchaseRequestId);
  res.json(result);
});

quoteRouter.get('/fluctuations', async (req: Request, res: Response) => {
  const materialName = req.query.materialName as string;
  const days = parseInt(req.query.days as string) || 30;
  const result = await getPriceFluctuations(materialName, days);
  res.json(result);
});

quoteRouter.put('/:id', async (req: Request, res: Response) => {
  const result = await updateQuote(
    req.params.id,
    req.body,
    mockUser.id,
    mockUser.name,
    req.body.changeReason
  );
  res.status(result.success ? 200 : 400).json(result);
});

quoteRouter.post('/:id/select', async (req: Request, res: Response) => {
  const { purchaseRequestId } = req.body;
  const adminUser = { id: 'admin-001', name: '王管理员' };
  const result = await selectQuote(
    req.params.id,
    purchaseRequestId,
    adminUser.id,
    adminUser.name
  );
  res.status(result.success ? 200 : 400).json(result);
});

quoteRouter.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const history = await getQuoteHistory(req.params.id);
    const response: ApiResponse = {
      success: true,
      data: history
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '查询失败'
    };
    res.status(500).json(response);
  }
});
