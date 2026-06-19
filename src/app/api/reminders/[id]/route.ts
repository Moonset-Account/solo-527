import { NextRequest, NextResponse } from 'next/server';
import { getDataService } from '@/lib/data-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const svc = await getDataService();
    const body = await request.json();

    let updated;
    if (body.isRead === true && Object.keys(body).length === 1) {
      updated = await svc.markReminderRead(params.id);
    } else {
      updated = await svc.markReminderRead(params.id);
    }

    if (!updated) {
      return NextResponse.json({ error: '提醒不存在' }, { status: 404 });
    }

    return NextResponse.json({ reminder: updated });
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
