import { NextResponse } from 'next/server';
import { mockChannels } from '@/lib/mockData';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: mockChannels,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '获取渠道列表失败' },
      { status: 500 }
    );
  }
}
