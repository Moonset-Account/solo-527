import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import { Types } from 'mongoose';
import Match from '@/models/Match';
import User from '@/models/User';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);
  if (payload.role !== 'admin') return errorResponse('仅管理员可分配裁判', 403);

  const { id } = await params;
  const body = await request.json();
  const { refereeId } = body;

  if (!refereeId) {
    return errorResponse('裁判ID为必填项');
  }

  const referee = await User.findById(refereeId);
  if (!referee || referee.role !== 'referee') {
    return errorResponse('指定的用户不是裁判', 400);
  }

  const match = await Match.findById(id);
  if (!match) return errorResponse('比赛不存在', 404);

  match.refereeId = new Types.ObjectId(refereeId);
  await match.save();

  await createAuditLog('referee', 'assign', payload.userId, id, { refereeId });

  return successResponse(match);
}
