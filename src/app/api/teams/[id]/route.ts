import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Team } from '@/lib/db/models';
import { successResponse, errorResponse, getServerSession } from '@/lib/utils/api';
import { hasPermission, findPermissionConfig } from '@/lib/utils/permissions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const session = await getServerSession();
    const permissionConfig = findPermissionConfig('/api/teams/:id', 'PATCH');
    
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const { id } = await params;
    const body = await request.json();
    
    const { status, rejectReason } = body;
    
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return errorResponse('无效的状态值');
    }

    const updateData: any = { status };
    if (status === 'REJECTED' && rejectReason) {
      updateData.rejectReason = rejectReason;
    }

    const team = await Team.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!team) {
      return errorResponse('球队不存在', undefined, 404);
    }

    return successResponse(team);
  } catch (error) {
    console.error('PATCH /api/teams/:id error:', error);
    return errorResponse('更新球队状态失败', undefined, 500);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const session = await getServerSession();
    const permissionConfig = findPermissionConfig('/api/teams/:id', 'GET');
    
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限访问', undefined, 403);
    }

    const { id } = await params;
    const team = await Team.findById(id)
      .populate('seasonId', 'name year')
      .lean();

    if (!team) {
      return errorResponse('球队不存在', undefined, 404);
    }

    return successResponse(team);
  } catch (error) {
    console.error('GET /api/teams/:id error:', error);
    return errorResponse('获取球队详情失败', undefined, 500);
  }
}
