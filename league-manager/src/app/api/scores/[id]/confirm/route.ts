import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import { recalculateStandings } from '@/lib/standings';
import Score from '@/models/Score';
import Match from '@/models/Match';
import Team from '@/models/Team';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);
  if (payload.role !== 'captain' && payload.role !== 'admin') {
    return errorResponse('仅队长可确认比分', 403);
  }

  const { id } = await params;
  const score = await Score.findById(id);
  if (!score) return errorResponse('比分记录不存在', 404);

  if (score.homeConfirmed && score.awayConfirmed) {
    return errorResponse('比分已双方确认');
  }

  const match = await Match.findById(score.matchId);
  if (!match) return errorResponse('关联比赛不存在', 404);

  const homeTeam = await Team.findById(match.homeTeamId);
  const awayTeam = await Team.findById(match.awayTeamId);
  if (!homeTeam || !awayTeam) return errorResponse('关联队伍不存在', 404);

  if (payload.role === 'admin') {
    score.homeConfirmed = true;
    score.awayConfirmed = true;
  } else if (homeTeam.captainId.toString() === payload.userId) {
    if (score.homeConfirmed) {
      return errorResponse('主队已确认该比分');
    }
    score.homeConfirmed = true;
  } else if (awayTeam.captainId.toString() === payload.userId) {
    if (score.awayConfirmed) {
      return errorResponse('客队已确认该比分');
    }
    score.awayConfirmed = true;
  } else {
    return errorResponse('您不是该比赛的队长', 403);
  }

  if (score.homeConfirmed && score.awayConfirmed) {
    score.confirmedAt = new Date();
    match.status = 'completed';
    await match.save();

    await recalculateStandings(match.seasonId.toString());
  }

  await score.save();

  await createAuditLog('score', 'confirm', payload.userId, id, {
    homeConfirmed: score.homeConfirmed,
    awayConfirmed: score.awayConfirmed,
    bothConfirmed: score.homeConfirmed && score.awayConfirmed,
  });

  return successResponse(score);
}
