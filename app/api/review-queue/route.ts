import { NextResponse } from 'next/server';
import * as dataAccess from '@/lib/dataAccess';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const channelId = searchParams.get('channelId') || undefined;

    const queue = await dataAccess.getReviewQueue(status, channelId);

    return NextResponse.json({
      success: true,
      data: queue,
    });
  } catch (error) {
    console.error('获取复核队列失败:', error);
    return NextResponse.json(
      { success: false, error: '获取复核队列失败' },
      { status: 500 }
    );
  }
}
