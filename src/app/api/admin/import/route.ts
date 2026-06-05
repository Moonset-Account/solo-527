import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { successResponse, errorResponse, getServerSession } from '@/lib/utils/api';
import { hasPermission, findPermissionConfig } from '@/lib/utils/permissions';
import { createImportTask, createExportTask, rollbackImport } from '@/lib/utils/import-export';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const session = getServerSession();
    const permissionConfig = findPermissionConfig('/api/admin/import', 'POST');
    
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entity = formData.get('entity') as string;

    if (!file || !entity) {
      return errorResponse('请上传文件并指定导入类型');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const taskId = await createImportTask(
      entity as any,
      buffer,
      file.name,
      session?.userId || 'system'
    );
    
    return successResponse({ taskId, message: '导入任务已创建' });
  } catch (error) {
    console.error('POST /api/admin/import error:', error);
    return errorResponse('创建导入任务失败', undefined, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const session = getServerSession();
    
    if (!session?.role || !['SUPER_ADMIN'].includes(session.role)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const { batchId } = await request.json();
    
    if (!batchId) {
      return errorResponse('批次ID不能为空');
    }

    const result = await rollbackImport(batchId);
    
    return successResponse(result);
  } catch (error) {
    console.error('DELETE /api/admin/import error:', error);
    return errorResponse('回滚失败', undefined, 500);
  }
}
