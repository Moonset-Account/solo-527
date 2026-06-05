import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { signToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { createAuditLog } from '@/lib/audit';
import User from '@/models/User';

export async function POST(request: Request) {
  await dbConnect();

  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return errorResponse('邮箱和密码为必填项');
  }

  const user = await User.findOne({ email });
  if (!user) {
    return errorResponse('邮箱或密码错误', 401);
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return errorResponse('邮箱或密码错误', 401);
  }

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  await createAuditLog('user', 'login', user._id.toString(), user._id.toString(), { email });

  return successResponse({
    token,
    user: { _id: user._id, email: user.email, name: user.name, role: user.role },
  });
}
