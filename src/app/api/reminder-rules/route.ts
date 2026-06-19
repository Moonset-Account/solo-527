import { NextRequest, NextResponse } from 'next/server';
import { getDataService } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  const svc = await getDataService();
  const { searchParams } = new URL(request.url);
  const isEnabled = searchParams.get('isEnabled');
  const type = searchParams.get('type');

  const rules = await svc.getReminderRules({
    isEnabled: isEnabled !== null ? isEnabled === 'true' : undefined,
    type: type as any,
  });

  return NextResponse.json({ rules });
}

export async function POST(request: NextRequest) {
  try {
    const svc = await getDataService();
    const body = await request.json();

    const rule = await svc.createReminderRule({
      name: body.name,
      type: body.type,
      description: body.description || undefined,
      isEnabled: body.isEnabled ?? true,
      beforeHours: body.beforeHours || 24,
      channel: body.channel || 'SYSTEM',
      template: body.template || undefined,
    }, 'user-1');

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '创建规则失败' }, { status: 500 });
  }
}
