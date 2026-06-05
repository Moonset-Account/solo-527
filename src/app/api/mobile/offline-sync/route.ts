import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { connectDB } from '@/lib/db/connect';
import { Match, PlayerStat, User } from '@/lib/db/models';
import { successResponse, errorResponse, getServerSession } from '@/lib/utils/api';
import { hasPermission, findPermissionConfig } from '@/lib/utils/permissions';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function base64ToBuffer(base64: string): { buffer: Buffer; mimeType: string } {
  const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('无效的 base64 格式');
  }
  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  return { buffer, mimeType };
}

async function processPhotoUpload(payload: any) {
  const { matchId, type, photoData } = payload;

  if (!photoData) {
    throw new Error('照片数据不能为空');
  }

  if (!matchId) {
    throw new Error('比赛ID不能为空');
  }

  if (!type) {
    throw new Error('上传类型不能为空');
  }

  const match = await Match.findById(matchId);
  if (!match) {
    throw new Error('比赛不存在');
  }

  const { buffer, mimeType } = base64ToBuffer(photoData);

  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new Error('不支持的文件类型，仅支持 JPEG、PNG、GIF、WebP 格式');
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('文件大小不能超过 5MB');
  }

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const ext = mimeType.split('/')[1] || 'jpg';
  const fileName = `${matchId}_${type}_${timestamp}_${randomString}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  await writeFile(filePath, buffer);

  return {
    fileUrl: `/uploads/${fileName}`,
    fileName,
    type,
    matchId,
    size: buffer.length,
  };
}

async function processCheckin(payload: any) {
  const { matchId, userId, type } = payload;

  if (!matchId) {
    throw new Error('比赛ID不能为空');
  }

  if (!userId) {
    throw new Error('用户ID不能为空');
  }

  if (!type) {
    throw new Error('签到类型不能为空');
  }

  const validTypes = ['REFEREE', 'TEAM_STAFF', 'PLAYER', 'FIELD_STAFF'];
  if (!validTypes.includes(type)) {
    throw new Error('无效的签到类型');
  }

  const match = await Match.findById(matchId);
  if (!match) {
    throw new Error('比赛不存在');
  }

  const user = await User.findById(userId);
  if (!user && userId !== 'current-user') {
    throw new Error('用户不存在');
  }

  if (type === 'REFEREE' && !match.refereeIds.includes(userId)) {
    throw new Error('该用户不是本场比赛的裁判');
  }

  const checkinTime = new Date();

  return {
    matchId,
    userId,
    type,
    checkinTime,
    message: '签到成功',
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getServerSession();
    const permissionConfig = findPermissionConfig('/api/mobile/offline-sync', 'POST');
    
    if (permissionConfig && !hasPermission(session?.role, permissionConfig.allowedRoles)) {
      return errorResponse('无权限操作', undefined, 403);
    }

    const { actions } = await request.json();
    
    if (!actions || !Array.isArray(actions)) {
      return errorResponse('无效的同步数据');
    }

    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'SCORE_UPDATE':
            await Match.findByIdAndUpdate(action.payload.matchId, {
              homeScore: action.payload.score.homeScore,
              awayScore: action.payload.score.awayScore,
              quarterScores: action.payload.score.quarterScores,
              status: action.payload.score.status || 'LIVE',
            });
            results.success.push(action.id);
            break;

          case 'PLAYER_STAT':
            await PlayerStat.findOneAndUpdate(
              { matchId: action.payload.matchId, playerId: action.payload.playerId },
              action.payload.stats,
              { upsert: true }
            );
            results.success.push(action.id);
            break;

          case 'CHECKIN':
            await processCheckin(action.payload);
            results.success.push(action.id);
            break;

          case 'PHOTO_UPLOAD':
            await processPhotoUpload(action.payload);
            results.success.push(action.id);
            break;

          default:
            results.failed.push({ id: action.id, error: '未知的操作类型' });
        }
      } catch (error) {
        results.failed.push({ 
          id: action.id, 
          error: error instanceof Error ? error.message : '同步失败' 
        });
      }
    }

    return successResponse(results);
  } catch (error) {
    console.error('POST /api/mobile/offline-sync error:', error);
    return errorResponse('同步失败', undefined, 500);
  }
}
