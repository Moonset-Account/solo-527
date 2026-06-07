import { NextResponse } from 'next/server';
import * as dataAccess from '@/lib/dataAccess';

const abnormalTypeMap: Record<string, string> = {
  fast_answer: '答题过快',
  duplicate_submission: '重复提交',
  device_concentration: '设备集中',
  skip_abnormal: '跳题异常',
  open_copy: '开放题复制',
};

const statusMap: Record<string, string> = {
  pending: '待复核',
  approved: '已通过',
  rejected: '已拒绝',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const format = searchParams.get('format') || 'csv';

    if (!channelId) {
      return NextResponse.json(
        { success: false, error: '请指定渠道ID' },
        { status: 400 }
      );
    }

    const samples = await dataAccess.getSamplesByChannel(channelId);

    const headers = [
      '样本ID',
      '渠道',
      '答题时长(秒)',
      'IP区域',
      '异常类型',
      '状态',
      '提交时间',
    ];

    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...samples.map(s => [
          s.id,
          s.channelName,
          s.totalDuration,
          s.ipRegion,
          s.abnormalTypes.map(t => abnormalTypeMap[t] || t).join('|'),
          statusMap[s.status] || s.status,
          s.submittedAt,
        ].join(','))
      ].join('\n');

      return new NextResponse('\ufeff' + csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="samples_${channelId}_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: samples,
    });
  } catch (error) {
    console.error('导出失败:', error);
    return NextResponse.json(
      { success: false, error: '导出失败' },
      { status: 500 }
    );
  }
}
