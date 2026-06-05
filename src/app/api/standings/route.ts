import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Standing } from '@/lib/db/models';
import { successResponse, errorResponse, getServerSession } from '@/lib/utils/api';
import { hasPermission, findPermissionConfig } from '@/lib/utils/permissions';
import { recalculateStandings } from '@/lib/utils/standings-engine';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getServerSession();
    const searchParams = request.nextUrl.searchParams;
    const seasonId = searchParams.get('seasonId');
    
    const permissionConfig = findPermissionConfig('/api/standings', 'GET');
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限访问', undefined, 403);
    }

    const query: any = {};
    if (seasonId) query.seasonId = seasonId;

    const standings = await Standing.find(query)
      .populate('teamId', 'name logo city')
      .sort({ rank: 1 })
      .lean();

    return successResponse(standings);
  } catch (error) {
    console.error('GET /api/standings error:', error);
    return errorResponse('获取积分榜失败', undefined, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getServerSession();
    const permissionConfig = findPermissionConfig('/api/standings/recalculate', 'POST');
    
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const { seasonId } = await request.json();
    
    if (!seasonId) {
      return errorResponse('赛季ID不能为空');
    }

    const standings = await recalculateStandings(seasonId);
    
    return successResponse(standings);
  } catch (error) {
    console.error('POST /api/standings/recalculate error:', error);
    return errorResponse('重新计算积分榜失败', undefined, 500);
  }
}
