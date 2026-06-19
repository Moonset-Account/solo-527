import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const isRead = searchParams.get('isRead');

  const where: any = {};
  if (userId) where.userId = userId;
  if (isRead !== null) where.isRead = isRead === 'true';

  const reminders = db.reminders.findMany(where ? { where } : undefined);

  return NextResponse.json({ reminders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const reminder = db.reminders.create({
      data: {
        type: body.type,
        userId: body.userId,
        contractId: body.contractId || null,
        ruleId: body.ruleId || null,
        title: body.title,
        message: body.message,
        isRead: false,
        isSent: body.isSent ?? true,
        scheduledAt: body.scheduledAt || null,
        sentAt: body.sentAt || new Date().toISOString(),
      },
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '创建提醒失败' }, { status: 500 });
  }
}
