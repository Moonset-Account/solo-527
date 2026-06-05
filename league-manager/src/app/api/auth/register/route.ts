import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { signToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import User from '@/models/User';

export async function POST(request: Request) {
  await dbConnect();

  const body = await request.json();
  const { email, password, name, phone } = body;

  if (!email || !password || !name) {
    return errorResponse('邮箱、密码和姓名为必填项');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return errorResponse('该邮箱已注册', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    role: 'captain',
    phone,
  });

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  await createAuditLog('user', 'register', user._id.toString(), user._id.toString(), { email, name, role: 'captain' });

  return successResponse(
    {
      token,
      user: { _id: user._id, email: user.email, name: user.name, role: user.role },
    },
    201
  );
}
