import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Match } from '@/lib/db/models';
import { successResponse, errorResponse, getServerSession } from '@/lib/utils/api';
import { hasPermission, findPermissionConfig } from '@/lib/utils/permissions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const session = await getServerSession();
    const permissionConfig = findPermissionConfig('/api/matches/:id', 'PATCH');
    
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const { id } = await params;
    const body = await request.json();
    
    const updateData: any = {};
    
    if (body.refereeIds !== undefined) {
      updateData.refereeIds = body.refereeIds;
    }
    
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    
    if (body.startTime !== undefined) {
      updateData.startTime = body.startTime;
    }
    
    if (body.venueId !== undefined) {
      updateData.venueId = body.venueId;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse('没有提供更新字段');
    }

    const match = await Match.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('homeTeamId awayTeamId venueId refereeIds', 'name');

    if (!match) {
      return errorResponse('比赛不存在', undefined, 404);
    }

    return successResponse(match);
  } catch (error) {
    console.error('PATCH /api/matches/:id error:', error);
    return errorResponse('更新比赛失败', undefined, 500);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const session = await getServerSession();
    const permissionConfig = findPermissionConfig('/api/matches/:id', 'GET');
    
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限访问', undefined, 403);
    }

    const { id } = await params;
    const match = await Match.findById(id)
      .populate('homeTeamId awayTeamId venueId refereeIds', 'name role')
      .populate('seasonId', 'name year')
      .lean();

    if (!match) {
      return errorResponse('比赛不存在', undefined, 404);
    }

    return successResponse(match);
  } catch (error) {
    console.error('GET /api/matches/:id error:', error);
    return errorResponse('获取比赛详情失败', undefined, 500);
  }
}
