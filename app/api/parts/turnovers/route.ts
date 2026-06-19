import { NextResponse } from 'next/server';
import { listPartTurnovers, createPartTurnover } from '@/lib/repo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? undefined;
  const part_id = searchParams.get('part_id') ?? undefined;
  const dateFrom = searchParams.get('from') ?? undefined;
  const dateTo = searchParams.get('to') ?? undefined;
  const data = await listPartTurnovers({
    filters: { type, part_id },
    dateFrom,
    dateTo,
    orderBy: { field: 'created_at', dir: 'desc' },
  });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const t = await createPartTurnover(body);
    return NextResponse.json({ data: t }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
