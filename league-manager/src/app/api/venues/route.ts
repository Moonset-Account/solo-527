import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import Venue from '@/models/Venue';

export async function GET(request: Request) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const total = await Venue.countDocuments({});
  const venues = await Venue.find({})
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  return paginatedResponse(venues, total, page, limit);
}

export async function POST(request: Request) {
  await dbConnect();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('未授权', 401);
  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return errorResponse('未授权', 401);
  if (payload.role !== 'admin') return errorResponse('仅管理员可创建场地', 403);

  const body = await request.json();
  const { name, address, capacity } = body;

  if (!name || !address) {
    return errorResponse('场地名称和地址为必填项');
  }

  const venue = await Venue.create({
    name,
    address,
    capacity: capacity || 0,
  });

  await createAuditLog('venue', 'create', payload.userId, venue._id.toString(), { name, address });

  return successResponse(venue, 201);
}
