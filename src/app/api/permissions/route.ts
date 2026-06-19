import { NextRequest, NextResponse } from 'next/server';
import { getDataService } from '@/lib/data-service';

export async function GET() {
  const svc = await getDataService();
  const permissions = await svc.getRolePermissions();
  return NextResponse.json({ permissions });
}

export async function PATCH(request: NextRequest) {
  try {
    const svc = await getDataService();
    const body = await request.json();
    const { role, ...data } = body;

    if (!role) {
      return NextResponse.json({ error: '缺少角色参数' }, { status: 400 });
    }

    const updated = await svc.updateRolePermission(role, data, 'user-1');

    if (!updated) {
      return NextResponse.json({ error: '角色权限不存在' }, { status: 404 });
    }

    return NextResponse.json({ permission: updated });
  } catch (error) {
    return NextResponse.json({ error: '更新权限失败' }, { status: 500 });
  }
}
