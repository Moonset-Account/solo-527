import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';
import { setCache, getCache } from '@/lib/redis';

const EFFICIENCY_STATS_KEY = 'contract:efficiency:stats';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const useCache = searchParams.get('cache') !== 'false';

  if (useCache) {
    const cached = await getCache(EFFICIENCY_STATS_KEY + (userId ? `:${userId}` : ''));
    if (cached) {
      return NextResponse.json({ stats: cached, fromCache: true });
    }
  }

  const where: any = {};
  if (userId) where.userId = userId;

  const stats = db.efficiencyStats.findMany(Object.keys(where).length > 0 ? { where } : undefined);

  await setCache(
    EFFICIENCY_STATS_KEY + (userId ? `:${userId}` : ''),
    stats,
    300
  );

  return NextResponse.json({ stats, fromCache: false });
}
