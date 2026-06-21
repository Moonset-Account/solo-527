import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import type { Role } from '@prisma/client';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  return user;
}

export async function requirePermission(resource: string, action: string) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  if (!hasPermission(user.role as Role, resource, action)) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }

  return user;
}
