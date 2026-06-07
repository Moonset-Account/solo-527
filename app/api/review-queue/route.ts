import { NextResponse } from 'next/server';
import { mockReviewQueue, mockChannels, generateMockSamples } from '@/lib/mockData';

let reviewQueue = [...mockReviewQueue];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const channelId = searchParams.get('channelId');

    let filtered = [...reviewQueue];
    
    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }
    if (channelId) {
      filtered = filtered.filter(item => item.channelId === channelId);
    }

    const pendingCount = reviewQueue.filter(item => item.status === 'pending').length;

    return NextResponse.json({
      success: true,
      data: {
        items: filtered,
        pendingCount,
        totalCount: reviewQueue.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '获取复核队列失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sampleId, channelId, channelName, abnormalTypes } = body;

    const newItem = {
      id: `rv-${Date.now()}`,
      sampleId,
      channelId,
      channelName,
      abnormalTypes,
      markedAt: new Date().toISOString(),
      status: 'pending' as const,
    };

    reviewQueue.push(newItem);

    return NextResponse.json({
      success: true,
      data: newItem,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '添加复核队列失败' },
      { status: 500 }
    );
  }
}
