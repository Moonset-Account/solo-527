import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const date = searchParams.get('date');

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.appointmentDate = { gte: start, lte: end };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(appointments);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { customerName, customerPhone, plateNo, serviceType, appointmentDate, timeSlot, remark } = body;

  if (!customerName || !customerPhone || !plateNo || !serviceType || !appointmentDate || !timeSlot) {
    return NextResponse.json(
      { error: 'customerName, customerPhone, plateNo, serviceType, appointmentDate, and timeSlot are required' },
      { status: 400 }
    );
  }

  const appointment = await prisma.appointment.create({
    data: {
      customerName,
      customerPhone,
      plateNo,
      serviceType,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      remark,
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
