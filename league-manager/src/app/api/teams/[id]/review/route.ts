import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import { notifyTeamReview } from '@/services/notification.service';
import { Types } from 'mongoose';
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
  if (payload.role !== 'admin') return errorResponse('仅管理员可审核队伍', 403);

  const { id } = await params;
  const body = await request.json();
  const { status, reviewComment } = body;

  if (!['approved', 'rejected'].includes(status)) {
    return errorResponse('审核状态必须为 approved 或 rejected');
  }

  const team = await Team.findById(id);
  if (!team) return errorResponse('队伍不存在', 404);

  team.status = status;
  team.reviewedBy = new Types.ObjectId(payload.userId);
  if (reviewComment) team.reviewComment = reviewComment;
  await team.save();

  await createAuditLog('team', `review_${status}`, payload.userId, id, { status, reviewComment });

  try {
    await notifyTeamReview(id, status);
  } catch {}

  return successResponse(team);
}
