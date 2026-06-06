import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

const demoUsers = [
  {
    id: 'demo-admin-1',
    name: '管理员',
    email: 'admin@demo.com',
    role: 'admin',
    image: null,
  },
  {
    id: 'demo-client-1',
    name: '张经理',
    email: 'client@demo.com',
    role: 'client',
    image: null,
  },
];

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    const user = demoUsers.find((u) => u.email === validated.email);

    if (!user) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    if (!['admin123', 'client123', 'demo'].includes(validated.password)) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    const cookieStore = cookies();
    cookieStore.set('user', JSON.stringify(user), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || '参数错误' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
