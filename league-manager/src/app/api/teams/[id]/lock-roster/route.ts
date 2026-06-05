import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import { notifyRosterLock } from '@/services/notification.service';
import Team from '@/models/Team';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);
  if (payload.role !== 'admin') return errorResponse('仅管理员可锁定花名册', 403);

  const { id } = await params;
  const team = await Team.findById(id);
  if (!team) return errorResponse('队伍不存在', 404);

  if (team.rosterLockedAt) {
    return errorResponse('花名册已锁定');
  }

  team.rosterLocked = true;
  team.rosterLockedAt = new Date();
  await team.save();

  await createAuditLog('team', 'lock_roster', payload.userId, id);

  try {
    await notifyRosterLock(id);
  } catch {}

  return successResponse(team);
}
