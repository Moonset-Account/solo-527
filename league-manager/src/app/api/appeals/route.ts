import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import { Types } from 'mongoose';
import Appeal from '@/models/Appeal';
import Match from '@/models/Match';
import Season from '@/models/Season';

export async function GET(request: Request) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');
  const matchId = searchParams.get('matchId');
  const submittedBy = searchParams.get('submittedBy');

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (matchId) filter.matchId = matchId;
  if (submittedBy) filter.submittedBy = submittedBy;

  if (payload.role !== 'admin') {
    filter.submittedBy = payload.userId;
  }

  const total = await Appeal.countDocuments(filter);
  const appeals = await Appeal.find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('matchId')
    .populate('submittedBy', 'name email')
    .sort({ createdAt: -1 });

  return paginatedResponse(appeals, total, page, limit);
}

export async function POST(request: Request) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);
  if (payload.role !== 'captain' && payload.role !== 'admin') {
    return errorResponse('仅队长或管理员可提交申诉', 403);
  }

  const body = await request.json();
  const { matchId, reason, evidence } = body;

  if (!matchId || !reason) {
    return errorResponse('比赛ID和原因为必填项');
  }

  const match = await Match.findById(matchId);
  if (!match) return errorResponse('比赛不存在', 404);

  const season = await Season.findById(match.seasonId);
  if (!season) return errorResponse('赛季不存在', 404);

  const deadline = new Date(
    match.matchDate.getTime() + season.appealDeadlineDays * 24 * 60 * 60 * 1000
  );

  if (Date.now() > deadline.getTime()) {
    return errorResponse('已超过申诉截止时间', 400);
  }

  const existingAppeal = await Appeal.findOne({
    matchId,
    submittedBy: payload.userId,
    status: 'pending',
  });
  if (existingAppeal) {
    return errorResponse('您已对该比赛提交过申诉', 409);
  }

  const appeal = await Appeal.create({
    matchId,
    submittedBy: new Types.ObjectId(payload.userId),
    reason,
    evidence: evidence || [],
    status: 'pending',
    deadline,
  });

  await createAuditLog('appeal', 'submit', payload.userId, matchId, { reason });

  return successResponse(appeal, 201);
}
