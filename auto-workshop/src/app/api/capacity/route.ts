import { NextResponse } from 'next/server';
import { getTechnicianCapacityReport, recalculateCapacity } from '@/lib/capacity';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const technicianId = searchParams.get('technicianId');
  const periodStart = searchParams.get('periodStart');
  const periodEnd = searchParams.get('periodEnd');

  const report = await getTechnicianCapacityReport(
    technicianId || undefined,
    periodStart ? new Date(periodStart) : undefined,
    periodEnd ? new Date(periodEnd) : undefined
  );

  return NextResponse.json(report);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { technicianId, periodStart, periodEnd } = body;

  if (!technicianId || !periodStart || !periodEnd) {
    return NextResponse.json(
      { error: 'technicianId, periodStart, and periodEnd are required' },
      { status: 400 }
    );
  }

  const result = await recalculateCapacity(
    technicianId,
    new Date(periodStart),
    new Date(periodEnd)
  );

  return NextResponse.json(result);
}
