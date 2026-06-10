import { Router, Request, Response } from 'express';
import { AgreementStatus, ApiResponse } from '@app/shared';
import {
  createFrameworkAgreement,
  updateFrameworkAgreement,
  listFrameworkAgreements,
  getFrameworkAgreement,
  getAgreementHistory,
  getDocumentVersionDiff
} from '../services/agreementService.js';

export const agreementRouter = Router();

const mockUser = { id: 'admin-001', name: '王管理员' };

agreementRouter.post('/', async (req: Request, res: Response) => {
  const result = await createFrameworkAgreement(
    req.body,
    mockUser.id,
    mockUser.name
  );
  res.status(result.success ? 200 : 400).json(result);
});

agreementRouter.get('/', async (req: Request, res: Response) => {
  const query = {
    status: req.query.status as AgreementStatus,
    supplierId: req.query.supplierId as string,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20
  };
  const result = await listFrameworkAgreements(query);
  res.json(result);
});

agreementRouter.get('/:id', async (req: Request, res: Response) => {
  const result = await getFrameworkAgreement(req.params.id);
  res.status(result.success ? 200 : 404).json(result);
});

agreementRouter.put('/:id', async (req: Request, res: Response) => {
  const result = await updateFrameworkAgreement(
    req.params.id,
    req.body,
    mockUser.id,
    mockUser.name,
    req.body.changeReason
  );
  res.status(result.success ? 200 : 400).json(result);
});

agreementRouter.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const history = await getAgreementHistory(req.params.id);
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

agreementRouter.get('/diff/:entityType/:entityId', async (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;
  const validTypes = ['purchase_request', 'quote', 'agreement'];
  if (!validTypes.includes(entityType)) {
    return res.status(400).json({
      success: false,
      error: '无效的实体类型'
    });
  }
  const result = await getDocumentVersionDiff(
    entityType as any,
    entityId
  );
  res.json(result);
});
