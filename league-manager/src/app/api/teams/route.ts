import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import Team from '@/models/Team';
import Player from '@/models/Player';

export async function GET(request: Request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const seasonId = searchParams.get('seasonId');

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (seasonId) filter.seasonId = seasonId;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const total = await Team.countDocuments(filter);
  const teams = await Team.find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('captainId', 'name email')
    .populate('players')
    .sort({ createdAt: -1 });

  return paginatedResponse(teams, total, page, limit);
}

export async function POST(request: Request) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);
  if (payload.role !== 'captain' && payload.role !== 'admin') {
    return errorResponse('仅队长或管理员可创建队伍', 403);
  }

  const body = await request.json();
  const { name, seasonId, players } = body;

  if (!name || !seasonId) {
    return errorResponse('队伍名称和赛季ID为必填项');
  }

  const team = await Team.create({
    name,
    captainId: payload.userId,
    seasonId,
    players: [],
    status: 'pending',
  });

  if (players && Array.isArray(players) && players.length > 0) {
    const playerDocs = await Player.insertMany(
      players.map((p: { name: string; number: number; position: string }) => ({
        name: p.name,
        number: p.number,
        position: p.position,
        teamId: team._id,
      }))
    );
    team.players = playerDocs.map((p) => p._id);
    await team.save();
  }

  await createAuditLog('team', 'create', payload.userId, team._id.toString(), { name, seasonId });

  const populated = await Team.findById(team._id).populate('captainId', 'name email').populate('players');

  return successResponse(populated, 201);
}
