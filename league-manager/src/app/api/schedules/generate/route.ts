import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import { Types } from 'mongoose';
import Team from '@/models/Team';
import Match from '@/models/Match';

export async function POST(request: Request) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);
  if (payload.role !== 'admin') return errorResponse('仅管理员可生成赛程', 403);

  const body = await request.json();
  const { seasonId, startDate, matchIntervalDays = 7 } = body;

  if (!seasonId || !startDate) {
    return errorResponse('赛季ID和开始日期为必填项');
  }

  const teams = await Team.find({ seasonId, status: 'approved' });
  if (teams.length < 2) {
    return errorResponse('至少需要2支已审核通过的队伍');
  }

  const existingMatches = await Match.find({ seasonId });
  if (existingMatches.length > 0) {
    return errorResponse('该赛季已存在赛程，请先清除后再生成', 409);
  }

  const teamIds: (Types.ObjectId | null)[] = teams.map((t) => t._id);
  let n = teamIds.length;

  if (n % 2 !== 0) {
    teamIds.push(null);
    n = teamIds.length;
  }

  const teamList = [...teamIds];
  const rounds: { home: Types.ObjectId; away: Types.ObjectId }[][] = [];

  for (let round = 0; round < n - 1; round++) {
    const roundMatches: { home: Types.ObjectId; away: Types.ObjectId }[] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = teamList[i];
      const away = teamList[n - 1 - i];
      if (home !== null && away !== null) {
        if (round % 2 === 0) {
          roundMatches.push({ home, away });
        } else {
          roundMatches.push({ home: away, away: home });
        }
      }
    }
    rounds.push(roundMatches);

    const last = teamList.pop()!;
    teamList.splice(1, 0, last);
  }

  const matches = [];
  const start = new Date(startDate);

  for (let r = 0; r < rounds.length; r++) {
    const matchDate = new Date(start);
    matchDate.setDate(matchDate.getDate() + r * matchIntervalDays);

    for (const pairing of rounds[r]) {
      const created = await Match.create({
        seasonId,
        round: r + 1,
        homeTeamId: pairing.home,
        awayTeamId: pairing.away,
        matchDate,
        status: 'scheduled',
      });
      matches.push(created);
    }
  }

  await createAuditLog('schedule', 'generate', payload.userId, seasonId, {
    teamCount: teams.length,
    matchCount: matches.length,
    roundCount: rounds.length,
  });

  return successResponse(
    { roundCount: rounds.length, matchCount: matches.length, matches },
    201
  );
}
