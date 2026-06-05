import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import Message from '@/models/Message';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);

  const { id } = await params;
  const message = await Message.findById(id);
  if (!message) return errorResponse('消息不存在', 404);

  if (message.userId.toString() !== payload.userId) {
    return errorResponse('无权操作', 403);
  }

  message.read = true;
  await message.save();

  return successResponse(message);
}
