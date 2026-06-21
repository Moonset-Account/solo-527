import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { Role } from '@prisma/client';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (user.role === 'admin') {
      return NextResponse.json([{ role: 'admin', resource: '*', action: '*' }]);
    }

    const permissions = await prisma.rolePermission.findMany({
      where: { role: user.role as Role },
      select: { id: true, role: true, resource: true, action: true },
    });

    if (permissions.length === 0) {
      const { rolePermissions } = await import('@/lib/permissions');
      const staticPerms = rolePermissions[user.role as Role] || [];
      const flat = staticPerms.flatMap((p) =>
        p.actions.map((action) => ({
          id: `${user.role}-${p.resources[0]}-${action}`,
          role: user.role,
          resource: p.resources[0],
          action,
        }))
      );
      return NextResponse.json(flat);
    }

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Permissions API error:', error);
    return NextResponse.json({ error: '获取权限失败' }, { status: 500 });
  }
}
