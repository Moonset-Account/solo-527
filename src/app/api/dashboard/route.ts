import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboardService';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import type { Role } from '@prisma/client';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (!hasPermission(user.role as Role, 'dashboard', 'view')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const data = await dashboardService.getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: '获取驾驶舱数据失败' },
      { status: 500 }
    );
  }
}
