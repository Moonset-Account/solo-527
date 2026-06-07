import { NextResponse } from 'next/server';
import * as dataAccess from '@/lib/dataAccess';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids, action, reviewer } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: '请选择要审核的样本' },
        { status: 400 }
      );
    }

    if (!action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json(
        { success: false, error: '无效的审核操作' },
        { status: 400 }
      );
    }

    const result = await dataAccess.batchReview(ids, action, reviewer);
    
    const updatedChannels = await dataAccess.getChannels();
    
    return NextResponse.json({
      success: true,
      message: `成功${action === 'approved' ? '通过' : '拒绝'}了 ${result.processedCount} 条记录，渠道质量分已更新`,
      data: {
        ...result,
        updatedChannels,
      },
    });
  } catch (error) {
    console.error('批量审核失败:', error);
    return NextResponse.json(
      { success: false, error: '批量审核失败' },
      { status: 500 }
    );
  }
}
