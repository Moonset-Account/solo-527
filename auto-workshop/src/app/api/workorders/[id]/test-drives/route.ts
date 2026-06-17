import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const testDrives = await prisma.testDrive.findMany({
    where: { workOrderId: id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(testDrives);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { startTime, driverName, mileage, remark } = body;

  if (!startTime || !driverName) {
    return NextResponse.json(
      { error: 'startTime and driverName are required' },
      { status: 400 }
    );
  }

  const testDrive = await prisma.testDrive.create({
    data: {
      workOrderId: id,
      startTime: new Date(startTime),
      driverName,
      mileage,
      remark,
    },
  });

  return NextResponse.json(testDrive, { status: 201 });
}
