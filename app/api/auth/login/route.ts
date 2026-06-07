import { NextResponse } from 'next/server';
import { validateCredentials } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    const user = await validateCredentials(username, password);

    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        organization: user.organization,
      },
    });

    response.cookies.set('auth_token', JSON.stringify({
      userId: user.id,
      username: user.username,
      role: user.role,
      organization: user.organization,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { error: '登录失败: ' + error.message },
      { status: 500 }
    );
  }
}
