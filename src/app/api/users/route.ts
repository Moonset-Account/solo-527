import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  const where: any = {};
  if (role) where.role = role;

  const users = db.users.findMany(Object.keys(where).length > 0 ? { where } : undefined);
  return NextResponse.json({ users });
}
