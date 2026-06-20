import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export async function getPrismaClient(): Promise<PrismaClient | null> {
  if (prisma) return prisma;
  
  try {
    prisma = new PrismaClient();
    await prisma.$connect();
    console.log('Prisma connected to MySQL successfully');
    return prisma;
  } catch (error) {
    console.warn('MySQL connection failed, using mock data mode:', (error as Error).message);
    prisma = null;
    return null;
  }
}

export async function isDatabaseAvailable(): Promise<boolean> {
  const client = await getPrismaClient();
  return client !== null;
}
