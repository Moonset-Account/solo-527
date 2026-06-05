import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { errorResponse, paginatedResponse } from '@/lib/response';
import AuditLog from '@/models/AuditLog';

export async function GET(request: Request) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);
  if (payload.role !== 'admin') return errorResponse('仅管理员可查看审计日志', 403);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const auditModule = searchParams.get('module');
  const action = searchParams.get('action');
  const operatorId = searchParams.get('operatorId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const filter: Record<string, unknown> = {};
  if (auditModule) filter.module = auditModule;
  if (action) filter.action = action;
  if (operatorId) filter.operatorId = operatorId;

  if (startDate || endDate) {
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    filter.createdAt = dateFilter;
  }

  const total = await AuditLog.countDocuments(filter);
  const logs = await AuditLog.find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('operatorId', 'name email')
    .sort({ createdAt: -1 });

  return paginatedResponse(logs, total, page, limit);
}
