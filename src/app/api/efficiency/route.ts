import { NextRequest, NextResponse } from 'next/server';
import { getDataService } from '@/lib/data-service';
import { setCache, getCache } from '@/lib/redis';

const EFFICIENCY_STATS_KEY = 'contract:efficiency:stats';

export async function GET(request: NextRequest) {
  const svc = await getDataService();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const useCache = searchParams.get('cache') !== 'false';

  if (useCache) {
    const cached = await getCache(EFFICIENCY_STATS_KEY + (userId ? `:${userId}` : ''));
    if (cached) {
      return NextResponse.json({ stats: cached, fromCache: true });
    }
  }

  const stats = await svc.getEfficiencyStats(userId || undefined);

  await setCache(
    EFFICIENCY_STATS_KEY + (userId ? `:${userId}` : ''),
    stats,
    300
  );

  return NextResponse.json({ stats, fromCache: false });
}
