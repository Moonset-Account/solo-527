import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/lib/auth';
import { reminderRuleService } from '@/server/services/reminder-rule.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['ADMIN', 'ADMIN_LEAD']);
    const result = await reminderRuleService.triggerRule(params.id, session.userId);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    const status =
      err.message === '规则不存在' ? 404 : err.message === '未登录' ? 401 : err.message === '无权限' ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
