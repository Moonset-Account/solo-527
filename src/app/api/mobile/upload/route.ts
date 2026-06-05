import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { connectDB } from '@/lib/db/connect';
import { Match } from '@/lib/db/models';
import { successResponse, errorResponse, getServerSession } from '@/lib/utils/api';
import { hasPermission, findPermissionConfig } from '@/lib/utils/permissions';

export const runtime = 'nodejs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession();
    const permissionConfig = findPermissionConfig('/api/mobile/upload', 'POST');

    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const matchId = formData.get('matchId') as string | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return errorResponse('请选择要上传的文件');
    }

    if (!matchId) {
      return errorResponse('比赛ID不能为空');
    }

    if (!type) {
      return errorResponse('上传类型不能为空');
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return errorResponse('比赛不存在', undefined, 404);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse('不支持的文件类型，仅支持 JPEG、PNG、GIF、WebP 格式');
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('文件大小不能超过 5MB');
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.name) || '.jpg';
    const fileName = `${matchId}_${type}_${timestamp}_${randomString}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`;

    return successResponse({
      fileUrl,
      fileName,
      type,
      matchId,
      size: file.size,
    });
  } catch (error) {
    console.error('POST /api/mobile/upload error:', error);
    return errorResponse('文件上传失败', undefined, 500);
  }
}
