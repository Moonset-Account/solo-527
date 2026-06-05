import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Match } from '@/lib/db/models';
import { successResponse, errorResponse, getServerSession } from '@/lib/utils/api';
import { hasPermission, findPermissionConfig } from '@/lib/utils/permissions';
import { ScoreUpdateSchema } from '@/lib/validations/schemas';
import { updateStandingsAfterMatch } from '@/lib/utils/standings-engine';
import { createMatchNotifications } from '@/lib/utils/notifications';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    const session = await getServerSession();
    const permissionConfig = findPermissionConfig('/api/matches/:id/score', 'PUT');
    
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const body = await request.json();
    const validated = ScoreUpdateSchema.safeParse(body);
    
    if (!validated.success) {
      return errorResponse('数据验证失败', validated.error.errors.map(e => e.message));
    }

    const match = await Match.findById(id);
    if (!match) {
      return errorResponse('比赛不存在', undefined, 404);
    }

    const updatedMatch = await Match.findByIdAndUpdate(
      id,
      {
        ...validated.data,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (validated.data.status === 'FINISHED') {
      await updateStandingsAfterMatch(id);
    }

    await createMatchNotifications(id, 'SCORE_UPDATED');
    
    return successResponse(updatedMatch);
  } catch (error) {
    console.error('PUT /api/matches/:id/score error:', error);
    return errorResponse('更新比分失败', undefined, 500);
  }
}
