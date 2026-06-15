import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/lib/auth';
import { reminderRuleService } from '@/server/services/reminder-rule.service';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['ADMIN', 'ADMIN_LEAD']);
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '50');
    const enabledParam = searchParams.get('enabled');
    const enabled =
      enabledParam === 'true' ? true : enabledParam === 'false' ? false : undefined;

    const data = await reminderRuleService.list({ page, pageSize, enabled });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    const status = err.message === '未登录' ? 401 : err.message === '无权限' ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['ADMIN', 'ADMIN_LEAD']);
    const body = await request.json();
    const rule = await reminderRuleService.create({
      ...body,
      creatorId: session.userId,
    });
    return NextResponse.json({ success: true, data: rule });
  } catch (err: any) {
    const status = err.message === '未登录' ? 401 : err.message === '无权限' ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
