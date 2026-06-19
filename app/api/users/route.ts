import { NextResponse } from 'next/server';
import { listUsers } from '@/lib/repo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? undefined;
  const data = await listUsers({
    filters: { role },
    orderBy: { field: 'created_at', dir: 'asc' },
  });
  return NextResponse.json({ data });
}
