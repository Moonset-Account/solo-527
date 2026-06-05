import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { findUserById } from '@/lib/auth';

export const GET = requireAuth(async (request: NextRequest, user) => {
  const userData = findUserById(user.userId);
  if (!userData) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }
  return NextResponse.json(userData);
});
