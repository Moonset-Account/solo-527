import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as fileService from '@/lib/services/fileService';
import { Role } from '@/types';
import { canAccessProject } from '@/lib/auth';

export const GET = requireAuth(async (request: NextRequest, user, params: { id: string }) => {
  const projectId = parseInt(params.id);
  
  if (user.role === Role.CLIENT && !canAccessProject(user, projectId)) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  try {
    const files = fileService.getProjectFiles(projectId, user.userId, user.role);
    return NextResponse.json(files);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const POST = requireAuth(async (request: NextRequest, user, params: { id: string }) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }

  const projectId = parseInt(params.id);
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isPublic = formData.get('is_public') === 'true';

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    const uploadedFile = await fileService.uploadProjectFile(
      projectId,
      file,
      user.userId,
      isPublic
    );

    return NextResponse.json(uploadedFile, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
