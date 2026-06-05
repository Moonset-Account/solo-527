import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { successResponse, errorResponse, getServerSession } from '@/lib/utils/api';
import { hasPermission, findPermissionConfig } from '@/lib/utils/permissions';
import { createExportTask } from '@/lib/utils/import-export';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getServerSession();
    const permissionConfig = findPermissionConfig('/api/admin/export', 'GET');
    
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const searchParams = request.nextUrl.searchParams;
    const entity = searchParams.get('entity') as string;

    if (!entity) {
      return errorResponse('请指定导出类型');
    }

    const taskId = await createExportTask(
      entity as any,
      session?.userId || 'system'
    );
    
    return successResponse({ taskId, message: '导出任务已创建' });
  } catch (error) {
    console.error('GET /api/admin/export error:', error);
    return errorResponse('创建导出任务失败', undefined, 500);
  }
}
