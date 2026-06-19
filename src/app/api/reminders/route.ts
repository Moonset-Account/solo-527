import { NextRequest, NextResponse } from 'next/server';
import { getDataService } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  const svc = await getDataService();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const isRead = searchParams.get('isRead');

  const reminders = await svc.getReminders({
    userId: userId || undefined,
    isRead: isRead !== null ? isRead === 'true' : undefined,
  });

  return NextResponse.json({ reminders });
}

export async function POST(request: NextRequest) {
  try {
    const svc = await getDataService();
    const body = await request.json();

    await svc.pushReminder(
      body.type,
      body.userId,
      body.title,
      body.message,
      body.contractId || undefined
    );

    const reminders = await svc.getReminders({
      userId: body.userId,
      take: 1,
    });
    const reminder = reminders[0] || null;

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '创建提醒失败' }, { status: 500 });
  }
}
