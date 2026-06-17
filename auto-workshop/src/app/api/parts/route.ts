import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const partNo = searchParams.get('partNo');
  const isActive = searchParams.get('isActive');

  const where: Record<string, unknown> = {};
  if (name) where.name = { contains: name };
  if (partNo) where.partNo = { contains: partNo };
  if (isActive !== null) where.isActive = isActive === 'true';

  const parts = await prisma.part.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(parts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, partNo, category, price, stock, unit } = body;

  if (!name || !partNo || price === undefined || price === null || stock === undefined || stock === null) {
    return NextResponse.json(
      { error: 'name, partNo, price, and stock are required' },
      { status: 400 }
    );
  }

  const part = await prisma.part.create({
    data: { name, partNo, category, price, stock, unit },
  });

  return NextResponse.json(part, { status: 201 });
}
