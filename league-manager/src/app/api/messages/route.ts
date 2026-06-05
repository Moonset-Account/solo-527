import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { errorResponse, paginatedResponse } from '@/lib/response';
import Message from '@/models/Message';

export async function GET(request: Request) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const type = searchParams.get('type');

  const filter: Record<string, unknown> = { userId: payload.userId };
  if (type) filter.type = type;

  const total = await Message.countDocuments(filter);
  const unreadCount = await Message.countDocuments({ userId: payload.userId, read: false });

  const messages = await Message.find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  return paginatedResponse({ messages, unreadCount }, total, page, limit);
}
