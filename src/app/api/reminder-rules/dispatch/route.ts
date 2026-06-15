import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/lib/auth';
import { reminderRuleService } from '@/server/services/reminder-rule.service';

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['ADMIN', 'ADMIN_LEAD']);
    const result = await reminderRuleService.dispatchDue(session.userId);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    const status = err.message === '未登录' ? 401 : err.message === '无权限' ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
