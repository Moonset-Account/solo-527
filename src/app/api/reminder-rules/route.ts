import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isEnabled = searchParams.get('isEnabled');
  const type = searchParams.get('type');

  const where: any = {};
  if (isEnabled !== null) where.isEnabled = isEnabled === 'true';
  if (type) where.type = type;

  const rules = db.reminderRules.findMany(Object.keys(where).length > 0 ? { where } : undefined);

  return NextResponse.json({ rules });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const rule = db.reminderRules.create({
      data: {
        name: body.name,
        type: body.type,
        description: body.description || null,
        isEnabled: body.isEnabled ?? true,
        beforeHours: body.beforeHours || 24,
        channel: body.channel || 'SYSTEM',
        template: body.template || null,
      },
    });

    db.operationLogs.create({
      data: {
        operationType: 'UPDATE_RULE',
        userId: 'user-1',
        description: `创建提醒规则：${body.name}`,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '创建规则失败' }, { status: 500 });
  }
}
