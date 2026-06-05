import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Team, Player } from '@/lib/db/models';
import { successResponse, errorResponse, getServerSession } from '@/lib/utils/api';
import { hasPermission, filterSensitiveFields, findPermissionConfig } from '@/lib/utils/permissions';
import { TeamSchema } from '@/lib/validations/schemas';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const session = getServerSession();
    const searchParams = request.nextUrl.searchParams;
    const seasonId = searchParams.get('seasonId');
    const status = searchParams.get('status');
    
    const permissionConfig = findPermissionConfig('/api/teams', 'GET');
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限访问', undefined, 403);
    }

    const query: any = {};
    if (seasonId) query.seasonId = seasonId;
    if (status) query.status = status;

    const teams = await Team.find(query)
      .populate('seasonId', 'name year')
      .sort({ createdAt: -1 })
      .lean();

    const filteredTeams = teams.map(team => 
      filterSensitiveFields(team, permissionConfig?.sensitiveFields || [], session?.role)
    );

    return successResponse(filteredTeams);
  } catch (error) {
    console.error('GET /api/teams error:', error);
    return errorResponse('获取球队列表失败', undefined, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const session = getServerSession();
    const permissionConfig = findPermissionConfig('/api/teams', 'POST');
    
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const body = await request.json();
    const validated = TeamSchema.safeParse(body);
    
    if (!validated.success) {
      return errorResponse('数据验证失败', validated.error.errors.map(e => e.message));
    }

    const existingTeam = await Team.findOne({
      seasonId: validated.data.seasonId,
      name: validated.data.name,
    });

    if (existingTeam) {
      return errorResponse('该赛季已存在同名球队');
    }

    const team = await Team.create([validated.data]);
    
    return successResponse(team[0]);
  } catch (error: any) {
    console.error('POST /api/teams error:', error);
    if (error.code === 11000) {
      return errorResponse('该赛季已存在同名球队');
    }
    return errorResponse('创建球队失败', undefined, 500);
  }
}
