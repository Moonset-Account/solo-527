import { Router, Request, Response } from 'express';
import {
  SupplierQualificationStatus,
  QualificationAlertStatus,
  ApiResponse
} from '@app/shared';
import {
  createSupplier,
  updateSupplier,
  listSuppliers,
  getSupplier,
  checkAndCreateQualificationAlerts,
  assignQualificationAlert,
  resolveQualificationAlert,
  getApprovalBoardStats,
  listQualificationAlerts,
  getSupplierHistory
} from '../services/supplierService.js';

export const supplierRouter = Router();

const mockAdmin = { id: 'coordinator-001', name: '陈协同员', role: 'supplier_coordinator' };

supplierRouter.post('/', async (req: Request, res: Response) => {
  const result = await createSupplier(req.body, mockAdmin.id, mockAdmin.name);
  res.status(result.success ? 200 : 400).json(result);
});

supplierRouter.get('/', async (req: Request, res: Response) => {
  const query = {
    qualificationStatus: req.query.qualificationStatus as SupplierQualificationStatus,
    name: req.query.name as string,
    category: req.query.category as string,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20
  };
  const result = await listSuppliers(query);
  res.json(result);
});

supplierRouter.get('/:id', async (req: Request, res: Response) => {
  const result = await getSupplier(req.params.id);
  res.status(result.success ? 200 : 404).json(result);
});

supplierRouter.put('/:id', async (req: Request, res: Response) => {
  const result = await updateSupplier(
    req.params.id,
    req.body,
    mockAdmin.id,
    mockAdmin.name,
    req.body.changeReason
  );
  res.status(result.success ? 200 : 400).json(result);
});

supplierRouter.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const history = await getSupplierHistory(req.params.id);
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

supplierRouter.post('/qualifications/check', async (req: Request, res: Response) => {
  const result = await checkAndCreateQualificationAlerts();
  res.json(result);
});

supplierRouter.get('/qualifications/alerts', async (req: Request, res: Response) => {
  const query = {
    status: req.query.status as QualificationAlertStatus,
    assigneeId: req.query.assigneeId as string,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20
  };
  const result = await listQualificationAlerts(query);
  res.json(result);
});

supplierRouter.post('/qualifications/alerts/:id/assign', async (req: Request, res: Response) => {
  const result = await assignQualificationAlert(
    req.params.id,
    mockAdmin.id,
    mockAdmin.name
  );
  res.status(result.success ? 200 : 400).json(result);
});

supplierRouter.post('/qualifications/alerts/:id/resolve', async (req: Request, res: Response) => {
  const { resolution } = req.body;
  const result = await resolveQualificationAlert(
    req.params.id,
    resolution,
    mockAdmin.id,
    mockAdmin.name
  );
  res.status(result.success ? 200 : 400).json(result);
});

supplierRouter.get('/approval-board/stats', async (req: Request, res: Response) => {
  const assigneeId = req.query.assigneeId as string;
  const result = await getApprovalBoardStats(assigneeId);
  res.json(result);
});
