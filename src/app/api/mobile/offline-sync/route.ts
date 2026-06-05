import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Match, PlayerStat } from '@/lib/db/models';
import { successResponse, errorResponse, getServerSession } from '@/lib/utils/api';
import { hasPermission, findPermissionConfig } from '@/lib/utils/permissions';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const session = getServerSession();
    const permissionConfig = findPermissionConfig('/api/mobile/offline-sync', 'POST');
    
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const { actions } = await request.json();
    
    if (!actions || !Array.isArray(actions)) {
      return errorResponse('无效的同步数据');
    }

    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'SCORE_UPDATE':
            await Match.findByIdAndUpdate(action.payload.matchId, {
              homeScore: action.payload.score.homeScore,
              awayScore: action.payload.score.awayScore,
              quarterScores: action.payload.score.quarterScores,
              status: action.payload.score.status || 'LIVE',
            });
            results.success.push(action.id);
            break;

          case 'PLAYER_STAT':
            await PlayerStat.findOneAndUpdate(
              { matchId: action.payload.matchId, playerId: action.payload.playerId },
              action.payload.stats,
              { upsert: true }
            );
            results.success.push(action.id);
            break;

          case 'CHECKIN':
            results.success.push(action.id);
            break;

          default:
            results.failed.push({ id: action.id, error: '未知的操作类型' });
        }
      } catch (error) {
        results.failed.push({ 
          id: action.id, 
          error: error instanceof Error ? error.message : '同步失败' 
        });
      }
    }

    return successResponse(results);
  } catch (error) {
    console.error('POST /api/mobile/offline-sync error:', error);
    return errorResponse('同步失败', undefined, 500);
  }
}
