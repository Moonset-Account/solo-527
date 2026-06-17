import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const plateNo = searchParams.get('plateNo');
  const brand = searchParams.get('brand');

  const where: Record<string, unknown> = {};
  if (plateNo) where.plateNo = { contains: plateNo };
  if (brand) where.brand = { contains: brand };

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(vehicles);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { plateNo, brand, model, year, vin, mileage, customerId } = body;

  if (!plateNo || !brand || !model || !customerId) {
    return NextResponse.json(
      { error: 'plateNo, brand, model, and customerId are required' },
      { status: 400 }
    );
  }

  const vehicle = await prisma.vehicle.create({
    data: { plateNo, brand, model, year, vin, mileage, customerId },
    include: { customer: true },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
