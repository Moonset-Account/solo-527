import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import { recalculateStandings } from '@/lib/standings';
import { Types } from 'mongoose';
import Appeal from '@/models/Appeal';
import Score from '@/models/Score';
import Match from '@/models/Match';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);
  if (payload.role !== 'admin') return errorResponse('仅管理员可处理申诉', 403);

  const { id } = await params;
  const body = await request.json();
  const { status, resolution, newHomeScore, newAwayScore } = body;

  if (!['upheld', 'rejected'].includes(status)) {
    return errorResponse('处理状态必须为 upheld 或 rejected');
  }

  if (!resolution) {
    return errorResponse('处理结果说明为必填项');
  }

  const appeal = await Appeal.findById(id);
  if (!appeal) return errorResponse('申诉不存在', 404);

  if (appeal.status !== 'pending') {
    return errorResponse('该申诉已处理');
  }

  appeal.status = status;
  appeal.resolution = resolution;
  appeal.resolvedBy = new Types.ObjectId(payload.userId);
  appeal.resolvedAt = new Date();
  await appeal.save();

  if (status === 'upheld' && newHomeScore !== undefined && newAwayScore !== undefined) {
    const score = await Score.findOne({ matchId: appeal.matchId });
    if (score) {
      score.homeScore = newHomeScore;
      score.awayScore = newAwayScore;
      await score.save();

      const match = await Match.findById(appeal.matchId);
      if (match) {
        await recalculateStandings(match.seasonId.toString());
      }
    }
  }

  await createAuditLog('appeal', `resolve_${status}`, payload.userId, id, {
    resolution,
    newHomeScore,
    newAwayScore,
  });

  return successResponse(appeal);
}
