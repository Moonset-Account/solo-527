import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isActive = searchParams.get('isActive');

  const where: Record<string, unknown> = {};
  if (isActive !== null) where.isActive = isActive === 'true';

  const technicians = await prisma.technician.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(technicians);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, phone, specialty } = body;

  if (!name || !phone) {
    return NextResponse.json(
      { error: 'name and phone are required' },
      { status: 400 }
    );
  }

  const technician = await prisma.technician.create({
    data: { name, phone, specialty },
  });

  return NextResponse.json(technician, { status: 201 });
}
