import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import User from '@/models/User';

export async function GET(request: Request) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);

  if (payload.role !== 'admin') return errorResponse('仅管理员可查看裁判列表', 403);

  const referees = await User.find({ role: 'referee' }).select('name email').sort({ name: 1 });

  return successResponse(referees);
}
