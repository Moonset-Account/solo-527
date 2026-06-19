import { NextResponse } from 'next/server';
import { getWorkOrderById } from '@/lib/repo';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const data = await getWorkOrderById(params.id);
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ data });
}
