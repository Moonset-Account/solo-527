import { NextResponse } from 'next/server';
import { getSites, getMeasurements } from '@/lib/db';
import { calculateOverviewStats } from '@/lib/utils/dataUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organization = searchParams.get('organization');

    const sites = await getSites(organization || undefined);
    const siteIds = sites.map(s => s.id);

    const { data: measurements } = await getMeasurements({
      siteIds: siteIds.length > 0 ? siteIds : undefined,
      limit: 5000,
    });

    const stats = calculateOverviewStats(sites, measurements);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('获取总览数据错误:', error);
    return NextResponse.json(
      { error: '获取总览数据失败: ' + error.message },
      { status: 500 }
    );
  }
}
