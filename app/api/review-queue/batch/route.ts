import { NextResponse } from 'next/server';
import { mockReviewQueue, mockChannels } from '@/lib/mockData';

let reviewQueue = [...mockReviewQueue];
let channels = [...mockChannels];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids, action, reviewer = '系统管理员' } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: '请选择要处理的样本' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json(
        { success: false, error: '无效的操作类型' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const processedIds: string[] = [];
    const channelUpdates = new Map<string, { approved: number; rejected: number }>();

    reviewQueue = reviewQueue.map(item => {
      if (ids.includes(item.id) && item.status === 'pending') {
        processedIds.push(item.id);
        
        const current = channelUpdates.get(item.channelId) || { approved: 0, rejected: 0 };
        if (action === 'approved') {
          current.approved++;
        } else {
          current.rejected++;
        }
        channelUpdates.set(item.channelId, current);

        return {
          ...item,
          status: action as 'approved' | 'rejected',
          reviewer,
          reviewedAt: now,
        };
      }
      return item;
    });

    channels = channels.map(channel => {
      const updates = channelUpdates.get(channel.id);
      if (updates) {
        const newPending = Math.max(0, channel.pendingReview - processedIds.filter(id => 
          reviewQueue.find(r => r.id === id)?.channelId === channel.id
        ).length);
        
        const totalAbnormal = channel.fastAnswerCount + channel.duplicateSubmissionCount + 
          channel.deviceConcentrationCount + channel.skipAbnormalCount + channel.openCopyCount;
        
        const newQualityScore = totalAbnormal > 0 
          ? Math.round(100 - (totalAbnormal / channel.totalSamples) * 500)
          : 100;

        return {
          ...channel,
          pendingReview: newPending,
          qualityScore: Math.max(0, Math.min(100, newQualityScore)),
          updatedAt: now,
        };
      }
      return channel;
    });

    return NextResponse.json({
      success: true,
      data: {
        processedCount: processedIds.length,
        processedIds,
        updatedChannels: Array.from(channelUpdates.keys()),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '批量处理失败' },
      { status: 500 }
    );
  }
}
