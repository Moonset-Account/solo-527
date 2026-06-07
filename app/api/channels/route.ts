import { NextResponse } from 'next/server';
import * as dataAccess from '@/lib/dataAccess';

export async function GET() {
  try {
    const channels = await dataAccess.getChannels();
    const pendingCount = await dataAccess.getPendingReviewCount();
    
    return NextResponse.json({
      success: true,
      data: {
        channels,
        pendingCount,
      },
    });
  } catch (error) {
    console.error('获取渠道列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取渠道列表失败' },
      { status: 500 }
    );
  }
}
