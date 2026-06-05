import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Appeal } from '@/lib/db/models';
import { successResponse, errorResponse, getServerSession } from '@/lib/utils/api';
import { hasPermission, findPermissionConfig } from '@/lib/utils/permissions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const session = await getServerSession();
    const permissionConfig = findPermissionConfig('/api/appeals/:id', 'PATCH');
    
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const { id } = await params;
    const body = await request.json();
    
    const { status, decision } = body;
    
    if (!['REVIEWING', 'UPHELD', 'REJECTED'].includes(status)) {
      return errorResponse('无效的状态值');
    }

    const updateData: any = { 
      status,
      decidedAt: new Date(),
    };
    
    if (session?.userId) {
      updateData.decidedBy = session.userId;
    }
    
    if (decision) {
      updateData.decision = decision;
    }

    const appeal = await Appeal.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('matchId teamId submittedBy', 'name title');

    if (!appeal) {
      return errorResponse('申诉不存在', undefined, 404);
    }

    return successResponse(appeal);
  } catch (error) {
    console.error('PATCH /api/appeals/:id error:', error);
    return errorResponse('更新申诉失败', undefined, 500);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const session = await getServerSession();
    const permissionConfig = findPermissionConfig('/api/appeals/:id', 'GET');
    
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限访问', undefined, 403);
    }

    const { id } = await params;
    const appeal = await Appeal.findById(id)
      .populate('matchId', 'round homeTeamId awayTeamId startTime')
      .populate('teamId', 'name')
      .populate('submittedBy', 'name role')
      .populate('decidedBy', 'name')
      .lean();

    if (!appeal) {
      return errorResponse('申诉不存在', undefined, 404);
    }

    return successResponse(appeal);
  } catch (error) {
    console.error('GET /api/appeals/:id error:', error);
    return errorResponse('获取申诉详情失败', undefined, 500);
  }
}
