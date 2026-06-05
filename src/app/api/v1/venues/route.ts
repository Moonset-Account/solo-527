import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { venueSchema } from '@/lib/validations';
import { hasPermission } from '@/lib/utils';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const venues = await prisma.venue.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(venues);
  } catch (error) {
    console.error('Get venues error:', error);
    return NextResponse.json(
      { error: '获取场地列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session.user.role, ['COMMITTEE', 'SUPER_ADMIN'])) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const validated = venueSchema.parse(body);

    const venue = await prisma.venue.create({
      data: {
        name: validated.name,
        location: validated.location,
        capacity: validated.capacity,
        type: validated.type,
        facilities: validated.facilities,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'Venue',
        entityId: venue.id,
        newValue: venue as any,
      },
    });

    return NextResponse.json(venue, { status: 201 });
  } catch (error) {
    console.error('Create venue error:', error);
    return NextResponse.json(
      { error: '创建场地失败' },
      { status: 500 }
    );
  }
}
