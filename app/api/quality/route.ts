import { NextResponse } from 'next/server';
import { getSites, getMeasurements } from '@/lib/db';
import { checkDataQuality } from '@/lib/utils/dataUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organization = searchParams.get('organization');

    const sites = await getSites(organization || undefined);
    const siteIds = sites.map(s => s.id);

    const { data: measurements } = await getMeasurements({
      siteIds: siteIds.length > 0 ? siteIds : undefined,
      limit: 10000,
    });

    const qualityResult = checkDataQuality(measurements, sites);
    return NextResponse.json(qualityResult);
  } catch (error: any) {
    console.error('获取质量检查错误:', error);
    return NextResponse.json(
      { error: '获取质量检查失败: ' + error.message },
      { status: 500 }
    );
  }
}
