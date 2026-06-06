import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogsByEntity, getAuditLogsByUser } from '@/lib/audit';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser();

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '无权限查看审计日志' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const userId = searchParams.get('userId');

    if (entityType && entityId) {
      const logs = await getAuditLogsByEntity(entityType, entityId);
      return NextResponse.json({ logs });
    }

    if (userId) {
      const logs = await getAuditLogsByUser(userId);
      return NextResponse.json({ logs });
    }

    return NextResponse.json(
      { error: '缺少必要参数' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: '获取审计日志失败' },
      { status: 500 }
    );
  }
}
