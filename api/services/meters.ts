import type { MeterZone } from '../../shared/types';
import { mockZones } from '../mockData';
import { getPrismaClient } from '../prisma';

export async function getMeterZones(): Promise<MeterZone[]> {
  const prisma = await getPrismaClient();
  
  if (prisma) {
    const zones = await prisma.meterZone.findMany({
      orderBy: { code: 'asc' },
    });

    return zones.map(z => ({
      ...z,
      totalCapacity: Number(z.totalCapacity),
      createdAt: z.createdAt.toISOString(),
    }));
  }

  return mockZones;
}
