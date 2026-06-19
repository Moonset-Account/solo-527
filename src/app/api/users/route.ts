import { NextRequest, NextResponse } from 'next/server';
import { getDataService } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  const svc = await getDataService();
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  const users = await svc.getUsers({
    role: role || undefined,
  });
  return NextResponse.json({ users });
}
