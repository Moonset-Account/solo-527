import { Router, Request, Response } from 'express';
import { PurchaseStatus, ApiResponse } from '@app/shared';
import {
  createPurchaseRequest,
  updatePurchaseRequest,
  submitPurchaseRequest,
  getPurchaseRequest,
  listPurchaseRequests,
  getPurchaseRequestHistory
} from '../services/purchaseRequest.js';

export const purchaseRequestRouter = Router();

const mockUser = { id: 'user-001', name: '张经理', role: 'project_manager' };

purchaseRequestRouter.post('/', async (req: Request, res: Response) => {
  const result = await createPurchaseRequest(
    req.body,
    mockUser.id,
    mockUser.name
  );
  res.status(result.success ? 200 : 400).json(result);
});

purchaseRequestRouter.get('/', async (req: Request, res: Response) => {
  const query = {
    status: req.query.status as PurchaseStatus,
    projectName: req.query.projectName as string,
    projectManagerId: req.query.projectManagerId as string,
    department: req.query.department as string,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20
  };
  const result = await listPurchaseRequests(query);
  res.json(result);
});

purchaseRequestRouter.get('/:id', async (req: Request, res: Response) => {
  const result = await getPurchaseRequest(req.params.id);
  res.status(result.success ? 200 : 404).json(result);
});

purchaseRequestRouter.put('/:id', async (req: Request, res: Response) => {
  const result = await updatePurchaseRequest(
    req.params.id,
    req.body,
    mockUser.id,
    mockUser.name,
    req.body.changeReason
  );
  res.status(result.success ? 200 : 400).json(result);
});

purchaseRequestRouter.post('/:id/submit', async (req: Request, res: Response) => {
  const result = await submitPurchaseRequest(
    req.params.id,
    mockUser.id,
    mockUser.name
  );
  res.status(result.success ? 200 : 400).json(result);
});

purchaseRequestRouter.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const history = await getPurchaseRequestHistory(req.params.id);
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
