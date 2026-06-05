import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import { notifyScoreConfirmation } from '@/services/notification.service';
import { Types } from 'mongoose';
import Score from '@/models/Score';
import Match from '@/models/Match';

export async function POST(request: Request) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);
  if (payload.role !== 'referee' && payload.role !== 'admin') {
    return errorResponse('仅裁判或管理员可录入比分', 403);
  }

  const body = await request.json();
  const { matchId, homeScore, awayScore, events } = body;

  if (!matchId || homeScore === undefined || awayScore === undefined) {
    return errorResponse('比赛ID、主队得分和客队得分为必填项');
  }

  const match = await Match.findById(matchId);
  if (!match) return errorResponse('比赛不存在', 404);

  if (match.refereeId && match.refereeId.toString() !== payload.userId && payload.role !== 'admin') {
    return errorResponse('您不是该比赛的裁判', 403);
  }

  const existingScore = await Score.findOne({ matchId });
  if (existingScore) {
    return errorResponse('该比赛比分已录入', 409);
  }

  const score = await Score.create({
    matchId,
    homeScore,
    awayScore,
    recordedBy: new Types.ObjectId(payload.userId),
    events: events || [],
  });

  match.status = 'in_progress';
  await match.save();

  await createAuditLog('score', 'record', payload.userId, matchId, { homeScore, awayScore });

  try {
    await notifyScoreConfirmation(matchId);
  } catch {}

  return successResponse(score, 201);
}
