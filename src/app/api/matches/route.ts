import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Match, Season } from '@/lib/db/models';
import { successResponse, errorResponse, getServerSession } from '@/lib/utils/api';
import { hasPermission, findPermissionConfig } from '@/lib/utils/permissions';
import { MatchSchema, ScoreUpdateSchema } from '@/lib/validations/schemas';
import { calculateLockTime } from '@/lib/utils/business-rules';
import { updateStandingsAfterMatch } from '@/lib/utils/standings-engine';
import { createMatchNotifications } from '@/lib/utils/notifications';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const session = getServerSession();
    const searchParams = request.nextUrl.searchParams;
    const seasonId = searchParams.get('seasonId');
    const round = searchParams.get('round');
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');
    
    const permissionConfig = findPermissionConfig('/api/matches', 'GET');
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限访问', undefined, 403);
    }

    const query: any = {};
    if (seasonId) query.seasonId = seasonId;
    if (round) query.round = parseInt(round);
    if (teamId) {
      query.$or = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    }
    if (status) query.status = status;

    const matches = await Match.find(query)
      .populate('homeTeamId', 'name logo city')
      .populate('awayTeamId', 'name logo city')
      .populate('venueId', 'name address')
      .populate('refereeIds', 'name')
      .sort({ startTime: 1, round: 1 })
      .lean();

    return successResponse(matches);
  } catch (error) {
    console.error('GET /api/matches error:', error);
    return errorResponse('获取赛程失败', undefined, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const session = getServerSession();
    const permissionConfig = findPermissionConfig('/api/matches', 'POST');
    
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const body = await request.json();
    const validated = MatchSchema.safeParse(body);
    
    if (!validated.success) {
      return errorResponse('数据验证失败', validated.error.errors.map(e => e.message));
    }

    if (validated.data.homeTeamId === validated.data.awayTeamId) {
      return errorResponse('主队和客队不能相同');
    }

    const lockTime = await calculateLockTime(validated.data.startTime, validated.data.seasonId);

    const match = await Match.create([{
      ...validated.data,
      lockTime,
      rosterLocked: false,
    }]);

    await createMatchNotifications(match[0]._id.toString(), 'SCHEDULED');
    
    return successResponse(match[0]);
  } catch (error: any) {
    console.error('POST /api/matches error:', error);
    if (error.code === 11000) {
      return errorResponse('赛程安排冲突，同轮次已有该主场比赛或同时段同场馆已被占用');
    }
    return errorResponse('创建赛程失败', undefined, 500);
  }
}
