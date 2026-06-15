import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireRole } from '@/server/lib/auth';
import { statisticsService } from '@/server/services/statistics.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    const isAdmin = ['ADMIN', 'ADMIN_LEAD'].includes(session.role);
    const { searchParams } = new URL(request.url);
    const weeks = Number(searchParams.get('weeks') || '8');

    if (isAdmin) {
      const [ownership, dashboard, trend] = await Promise.all([
        statisticsService.getOwnershipStats({
          fromDate: searchParams.get('fromDate') || undefined,
          toDate: searchParams.get('toDate') || undefined,
        }),
        statisticsService.getDashboardStats(),
        statisticsService.getTrendData(weeks),
      ]);
      return NextResponse.json({
        success: true,
        data: { ownership, dashboard, trend },
      });
    }

    const [personal, trend] = await Promise.all([
      statisticsService.getOwnershipStats(),
      statisticsService.getTrendData(weeks),
    ]);
    const my = personal.find((p) => p.userId === session.userId);
    return NextResponse.json({
      success: true,
      data: { ownership: my ? [my] : [], trend },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
