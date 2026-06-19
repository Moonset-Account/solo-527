import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function GET() {
  const permissions = db.rolePermissions.findMany();
  return NextResponse.json({ permissions });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, ...data } = body;

    if (!role) {
      return NextResponse.json({ error: '缺少角色参数' }, { status: 400 });
    }

    const updated = db.rolePermissions.update({
      where: { role },
      data,
    });

    if (!updated) {
      return NextResponse.json({ error: '角色权限不存在' }, { status: 404 });
    }

    db.operationLogs.create({
      data: {
        operationType: 'UPDATE_PERMISSION',
        userId: 'user-1',
        description: `更新 ${role} 角色权限`,
      },
    });

    return NextResponse.json({ permission: updated });
  } catch (error) {
    return NextResponse.json({ error: '更新权限失败' }, { status: 500 });
  }
}
