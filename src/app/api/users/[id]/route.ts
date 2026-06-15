import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/lib/auth';
import { userService } from '@/server/services/user.service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['ADMIN']);
    const body = await request.json();

    if (body.role !== undefined) {
      await userService.updateRole(params.id, body.role, session.userId);
    }
    if (body.active !== undefined) {
      await userService.toggleActive(params.id, body.active);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
