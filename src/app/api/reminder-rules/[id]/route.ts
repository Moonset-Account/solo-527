import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/lib/auth';
import { reminderRuleService } from '@/server/services/reminder-rule.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['ADMIN', 'ADMIN_LEAD']);
    const rule = await reminderRuleService.getById(params.id);
    if (!rule)
      return NextResponse.json({ success: false, error: '规则不存在' }, { status: 404 });
    return NextResponse.json({ success: true, data: rule });
  } catch (err: any) {
    const status = err.message === '未登录' ? 401 : err.message === '无权限' ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['ADMIN', 'ADMIN_LEAD']);
    const body = await request.json();
    const rule = await reminderRuleService.update(params.id, body);
    return NextResponse.json({ success: true, data: rule });
  } catch (err: any) {
    const status =
      err.message === '规则不存在' ? 404 : err.message === '未登录' ? 401 : err.message === '无权限' ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['ADMIN', 'ADMIN_LEAD']);
    await reminderRuleService.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status =
      err.message === '规则不存在' ? 404 : err.message === '未登录' ? 401 : err.message === '无权限' ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
