import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Match, PlayerStat, Player } from '@/lib/db/models';
import { successResponse, errorResponse, getServerSession } from '@/lib/utils/api';
import { hasPermission, findPermissionConfig } from '@/lib/utils/permissions';
import { validateRosterLock } from '@/lib/utils/business-rules';
import { PlayerStatSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

const PlayerStatBatchSchema = z.array(PlayerStatSchema.omit({ matchId: true, teamId: true }).extend({ teamId: z.string().optional() }));

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const session = await getServerSession();
    const permissionConfig = findPermissionConfig('/api/matches/:id/stats', 'GET');

    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const match = await Match.findById(id);
    if (!match) {
      return errorResponse('比赛不存在', undefined, 404);
    }

    const stats = await PlayerStat.find({ matchId: id }).populate({
      path: 'playerId',
      select: 'name jerseyNumber position',
    });

    return successResponse(stats);
  } catch (error) {
    console.error('GET /api/matches/:id/stats error:', error);
    return errorResponse('获取球员数据统计失败', undefined, 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const session = await getServerSession();
    const permissionConfig = findPermissionConfig('/api/matches/:id/stats', 'POST');

    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const match = await Match.findById(id);
    if (!match) {
      return errorResponse('比赛不存在', undefined, 404);
    }

    const rosterLockResult = await validateRosterLock(id);
    if (!rosterLockResult.valid) {
      return errorResponse(rosterLockResult.message || '阵容已锁定，无法修改', undefined, 400);
    }

    const body = await request.json();
    const validated = PlayerStatBatchSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse('数据验证失败', validated.error.errors.map(e => e.message));
    }

    const statsData = validated.data;
    const savedStats = [];

    for (const stat of statsData) {
      const player = await Player.findById(stat.playerId);
      if (!player) {
        return errorResponse(`球员 ${stat.playerId} 不存在`, undefined, 404);
      }

      const teamId = stat.teamId || player.teamId;

      const existingStat = await PlayerStat.findOne({
        matchId: id,
        playerId: stat.playerId,
      });

      if (existingStat) {
        const updatedStat = await PlayerStat.findByIdAndUpdate(
          existingStat._id,
          {
            ...stat,
            matchId: id,
            teamId,
            updatedAt: new Date(),
          },
          { new: true }
        );
        savedStats.push(updatedStat);
      } else {
        const newStat = await PlayerStat.create({
          ...stat,
          matchId: id,
          teamId,
        });
        savedStats.push(newStat);
      }
    }

    return successResponse(savedStats);
  } catch (error) {
    console.error('POST /api/matches/:id/stats error:', error);
    return errorResponse('录入球员数据统计失败', undefined, 500);
  }
}
