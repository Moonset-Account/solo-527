import { NextResponse } from 'next/server';
import { listTeamSchedules, createTeamSchedule } from '@/lib/repo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team_id = searchParams.get('team_id') ?? undefined;
  const dateFrom = searchParams.get('from') ?? undefined;
  const dateTo = searchParams.get('to') ?? undefined;
  const data = await listTeamSchedules({
    filters: { team_id },
    dateFrom,
    dateTo,
    orderBy: { field: 'start_time', dir: 'asc' },
  });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const data = await createTeamSchedule(body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
