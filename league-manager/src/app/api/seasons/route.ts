import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import Season from '@/models/Season';

export async function GET(request: Request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const total = await Season.countDocuments(filter);
  const seasons = await Season.find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  return paginatedResponse(seasons, total, page, limit);
}

export async function POST(request: Request) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);
  if (payload.role !== 'admin') return errorResponse('仅管理员可创建赛季', 403);

  const body = await request.json();
  const { name, startDate, endDate, appealDeadlineDays } = body;

  if (!name || !startDate || !endDate) {
    return errorResponse('赛季名称、开始日期和结束日期为必填项');
  }

  if (new Date(startDate) >= new Date(endDate)) {
    return errorResponse('结束日期必须晚于开始日期');
  }

  const season = await Season.create({
    name,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    appealDeadlineDays: appealDeadlineDays || 3,
    status: 'upcoming',
  });

  await createAuditLog('schedule', 'create_season', payload.userId, season._id.toString(), { name });

  return successResponse(season, 201);
}
