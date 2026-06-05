import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import { notifyScheduleChange } from '@/services/notification.service';
import { Types } from 'mongoose';
import Match from '@/models/Match';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const { id } = await params;
  const match = await Match.findById(id)
    .populate('homeTeamId', 'name')
    .populate('awayTeamId', 'name')
    .populate('venueId', 'name address')
    .populate('refereeId', 'name email');

  if (!match) return errorResponse('比赛不存在', 404);

  return successResponse(match);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);
  if (payload.role !== 'admin') return errorResponse('仅管理员可调整赛程', 403);

  const { id } = await params;
  const body = await request.json();
  const { matchDate, venueId, refereeId, adjustmentReason } = body;

  const reason = adjustmentReason || '管理员调整赛程';

  const match = await Match.findById(id);
  if (!match) return errorResponse('比赛不存在', 404);

  if (matchDate) match.matchDate = new Date(matchDate);
  if (venueId) match.venueId = new Types.ObjectId(venueId);
  if (refereeId) match.refereeId = new Types.ObjectId(refereeId);
  match.adjustmentReason = reason;
  match.adjustedBy = new Types.ObjectId(payload.userId);
  await match.save();

  await createAuditLog('schedule', 'adjust', payload.userId, id, {
    matchDate,
    venueId,
    refereeId,
    adjustmentReason: reason,
  });

  try {
    await notifyScheduleChange(id);
  } catch {}

  return successResponse(match);
}
