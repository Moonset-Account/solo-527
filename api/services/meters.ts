import type { MeterZone } from '../../shared/types';
import { mockZones } from '../mockData';
import { getPrismaClient } from '../prisma';

interface ZoneQuery {
  status?: string;
  keyword?: string;
}

export async function getMeterZones(query: ZoneQuery = {}): Promise<MeterZone[]> {
  const prisma = await getPrismaClient();
  
  if (prisma) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword } },
        { code: { contains: query.keyword } },
        { location: { contains: query.keyword } },
      ];
    }

    const zones = await prisma.meterZone.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    return zones.map(z => ({
      ...z,
      totalCapacity: Number(z.totalCapacity),
      createdAt: z.createdAt.toISOString(),
    }));
  }

  let filtered = [...mockZones];
  if (query.status) {
    filtered = filtered.filter(z => z.status === query.status);
  }
  if (query.keyword) {
    const kw = query.keyword.toLowerCase();
    filtered = filtered.filter(z =>
      z.name.toLowerCase().includes(kw) ||
      z.code.toLowerCase().includes(kw) ||
      z.location.toLowerCase().includes(kw)
    );
  }

  return filtered;
}
