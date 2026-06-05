import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import Team from '@/models/Team';
import Player from '@/models/Player';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);

  const { id } = await params;
  const team = await Team.findById(id);
  if (!team) return errorResponse('队伍不存在', 404);

  if (team.rosterLockedAt) {
    return errorResponse('花名册已锁定，无法修改');
  }

  if (team.captainId.toString() !== payload.userId && payload.role !== 'admin') {
    return errorResponse('无权操作', 403);
  }

  const body = await request.json();
  const { players } = body;

  if (!players || !Array.isArray(players)) {
    return errorResponse('球员列表为必填项');
  }

  await Player.deleteMany({ teamId: team._id });

  if (players.length > 0) {
    const playerDocs = await Player.insertMany(
      players.map((p: { name: string; number: number; position: string }) => ({
        name: p.name,
        number: p.number,
        position: p.position,
        teamId: team._id,
      }))
    );
    team.players = playerDocs.map((p) => p._id);
  } else {
    team.players = [];
  }
  await team.save();

  await createAuditLog('team', 'update_roster', payload.userId, id, { playerCount: players.length });

  const populated = await Team.findById(id).populate('players');

  return successResponse(populated);
}
