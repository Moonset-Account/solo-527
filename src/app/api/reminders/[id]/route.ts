import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const updated = db.reminders.update({
      where: { id: params.id },
      data: body,
    });

    if (!updated) {
      return NextResponse.json({ error: '提醒不存在' }, { status: 404 });
    }

    return NextResponse.json({ reminder: updated });
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
