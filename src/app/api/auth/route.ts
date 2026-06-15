import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/server/services/user.service';
import { setSessionCookie, clearSessionCookie } from '@/server/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码不能为空' },
        { status: 400 }
      );
    }
    const { user, sid } = await userService.login(username, password);
    setSessionCookie(sid);
    return NextResponse.json({ success: true, data: user });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || '登录失败' },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  clearSessionCookie();
  return NextResponse.json({ success: true });
}
