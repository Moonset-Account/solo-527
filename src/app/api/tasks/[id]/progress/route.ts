import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/lib/auth';
import { taskService } from '@/server/services/task.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const result = await taskService.updateProgress(params.id, session.userId, body);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
