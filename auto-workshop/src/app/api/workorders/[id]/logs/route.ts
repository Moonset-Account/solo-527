import { NextResponse } from 'next/server';
import { getWorkOrderStatusLogs } from '@/lib/workorder-state';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const logs = await getWorkOrderStatusLogs(id);

  return NextResponse.json(logs);
}
