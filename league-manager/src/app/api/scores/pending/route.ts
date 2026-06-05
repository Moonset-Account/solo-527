import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import Score from '@/models/Score';
import Match from '@/models/Match';
import Team from '@/models/Team';

export async function GET(request: Request) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);
  if (payload.role !== 'captain' && payload.role !== 'admin') {
    return errorResponse('仅队长或管理员可查看待确认比分', 403);
  }

  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get('seasonId');

  let teamIds: string[] = [];

  if (payload.role === 'captain') {
    const teams = await Team.find({ captainId: payload.userId });
    teamIds = teams.map((t) => t._id.toString());
  } else {
    if (seasonId) {
      const teams = await Team.find({ seasonId });
      teamIds = teams.map((t) => t._id.toString());
    }
  }

  if (teamIds.length === 0) {
    return successResponse([]);
  }

  const matches = await Match.find({
    $or: [{ homeTeamId: { $in: teamIds } }, { awayTeamId: { $in: teamIds } }],
    ...(seasonId ? { seasonId } : {}),
  });

  const matchIds = matches.map((m) => m._id);
  const scores = await Score.find({
    matchId: { $in: matchIds },
    $or: [{ homeConfirmed: false }, { awayConfirmed: false }],
  }).populate('matchId');

  const pending = scores.map((score) => {
    const match = matches.find((m) => m._id.equals(score.matchId));
    if (!match) return null;

    const isHome = teamIds.includes(match.homeTeamId.toString());
    const isAway = teamIds.includes(match.awayTeamId.toString());

    let pendingSide: string | null = null;
    if (isHome && !score.homeConfirmed) pendingSide = 'home';
    if (isAway && !score.awayConfirmed) pendingSide = 'away';

    if (!pendingSide) return null;

    return {
      scoreId: score._id,
      matchId: match._id,
      matchDate: match.matchDate,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeScore: score.homeScore,
      awayScore: score.awayScore,
      pendingSide,
      homeConfirmed: score.homeConfirmed,
      awayConfirmed: score.awayConfirmed,
    };
  }).filter(Boolean);

  return successResponse(pending);
}
