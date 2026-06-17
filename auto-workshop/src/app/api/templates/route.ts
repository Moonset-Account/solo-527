import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/constants';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isActive = searchParams.get('isActive');

  const cacheKey = isActive !== null
    ? `${CACHE_KEYS.INSPECTION_TEMPLATES}:isActive=${isActive}`
    : CACHE_KEYS.INSPECTION_TEMPLATES;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  const where: Record<string, unknown> = {};
  if (isActive !== null) where.isActive = isActive === 'true';

  const templates = await prisma.inspectionTemplate.findMany({
    where,
    include: { items: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  await redis.set(cacheKey, JSON.stringify(templates), 'EX', CACHE_TTL.INSPECTION_TEMPLATES);

  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, description, items } = body;

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const template = await prisma.inspectionTemplate.create({
    data: {
      name,
      description,
      items: items
        ? {
            createMany: {
              data: items.map((item: { name: string; category: string; isRequired?: boolean; sortOrder?: number }) => ({
                name: item.name,
                category: item.category,
                isRequired: item.isRequired ?? true,
                sortOrder: item.sortOrder ?? 0,
              })),
            },
          }
        : undefined,
    },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });

  await redis.del(CACHE_KEYS.INSPECTION_TEMPLATES);

  return NextResponse.json(template, { status: 201 });
}
