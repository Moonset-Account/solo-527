import { NextResponse } from 'next/server';
import * as dataAccess from '@/lib/dataAccess';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sampleId, action, reviewer } = body;

    if (!sampleId) {
      return NextResponse.json(
        { success: false, error: '请指定样本ID' },
        { status: 400 }
      );
    }

    if (!action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json(
        { success: false, error: '无效的审核操作' },
        { status: 400 }
      );
    }

    const result = await dataAccess.reviewSingleSampleBySampleId(sampleId, action, reviewer);
    
    if (result.processedCount === 0) {
      return NextResponse.json({
        success: false,
        error: '未找到待审核的复核记录，或样本已处理',
      }, { status: 404 });
    }
    
    const updatedChannels = await dataAccess.getChannels();
    
    return NextResponse.json({
      success: true,
      message: `样本已${action === 'approved' ? '通过' : '拒绝'}，渠道质量分已更新`,
      data: {
        ...result,
        updatedChannels,
      },
    });
  } catch (error) {
    console.error('单样本审核失败:', error);
    return NextResponse.json(
      { success: false, error: '审核失败' },
      { status: 500 }
    );
  }
}
