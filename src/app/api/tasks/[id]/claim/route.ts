import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/lib/auth';
import { taskService } from '@/server/services/task.service';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const result = await taskService.claim(params.id, session.userId);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
