import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Match, User } from '@/lib/db/models';
import { successResponse, errorResponse, getServerSession } from '@/lib/utils/api';
import { hasPermission, findPermissionConfig } from '@/lib/utils/permissions';
import { z } from 'zod';

const CheckinSchema = z.object({
  matchId: z.string().min(1, '比赛ID不能为空'),
  userId: z.string().min(1, '用户ID不能为空'),
  type: z.enum(['REFEREE', 'TEAM_STAFF', 'PLAYER', 'FIELD_STAFF'], {
    errorMap: () => ({ message: '签到类型必须是 REFEREE、TEAM_STAFF、PLAYER 或 FIELD_STAFF' }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession();
    const permissionConfig = findPermissionConfig('/api/mobile/checkin', 'POST');

    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const body = await request.json();
    const validated = CheckinSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse('数据验证失败', validated.error.errors.map(e => e.message));
    }

    const { matchId, userId, type } = validated.data;

    const match = await Match.findById(matchId);
    if (!match) {
      return errorResponse('比赛不存在', undefined, 404);
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse('用户不存在', undefined, 404);
    }

    if (type === 'REFEREE' && !match.refereeIds.includes(userId)) {
      return errorResponse('该用户不是本场比赛的裁判', undefined, 400);
    }

    const checkinTime = new Date();

    return successResponse({
      matchId,
      userId,
      type,
      checkinTime,
      message: '签到成功',
    });
  } catch (error) {
    console.error('POST /api/mobile/checkin error:', error);
    return errorResponse('签到失败', undefined, 500);
  }
}
