import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Appeal, Match } from '@/lib/db/models';
import { successResponse, errorResponse, getServerSession } from '@/lib/utils/api';
import { hasPermission, findPermissionConfig } from '@/lib/utils/permissions';
import { AppealSchema } from '@/lib/validations/schemas';
import { validateAppealDeadline } from '@/lib/utils/business-rules';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const session = getServerSession();
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');
    
    const permissionConfig = findPermissionConfig('/api/appeals', 'GET');
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限访问', undefined, 403);
    }

    const query: any = {};
    if (teamId && session?.role === 'TEAM_MANAGER') {
      query.teamId = teamId;
    }
    if (status) query.status = status;

    const appeals = await Appeal.find(query)
      .populate('matchId', 'round startTime homeTeamId awayTeamId')
      .populate('teamId', 'name logo')
      .populate('submittedBy', 'name')
      .populate('decidedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(appeals);
  } catch (error) {
    console.error('GET /api/appeals error:', error);
    return errorResponse('获取申诉列表失败', undefined, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const session = getServerSession();
    const permissionConfig = findPermissionConfig('/api/appeals', 'POST');
    
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const body = await request.json();
    const validated = AppealSchema.safeParse(body);
    
    if (!validated.success) {
      return errorResponse('数据验证失败', validated.error.errors.map(e => e.message));
    }

    const deadlineCheck = await validateAppealDeadline(validated.data.matchId);
    
    if (!deadlineCheck.valid) {
      return errorResponse(deadlineCheck.message || '申诉提交失败');
    }

    const existingAppeal = await Appeal.findOne({
      matchId: validated.data.matchId,
      teamId: validated.data.teamId,
    });

    if (existingAppeal) {
      return errorResponse('该球队已对此比赛提交过申诉');
    }

    const appeal = await Appeal.create([{
      ...validated.data,
      submittedBy: session?.userId || validated.data.teamId,
      deadline: deadlineCheck.deadline,
      status: 'PENDING',
    }]);
    
    return successResponse(appeal[0]);
  } catch (error: any) {
    console.error('POST /api/appeals error:', error);
    if (error.code === 11000) {
      return errorResponse('该球队已对此比赛提交过申诉');
    }
    return errorResponse('提交申诉失败', undefined, 500);
  }
}
