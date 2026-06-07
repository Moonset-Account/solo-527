import { NextResponse } from 'next/server';
import { mockChannels, generateMockSamples, getDurationBins, getDeviceAggregation, getIpRegionAggregation } from '@/lib/mockData';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const channel = mockChannels.find(c => c.id === params.id);
    
    if (!channel) {
      return NextResponse.json(
        { success: false, error: '渠道不存在' },
        { status: 404 }
      );
    }

    const samples = generateMockSamples(params.id, 100);
    const durations = samples.map(s => s.totalDuration);
    const durationBins = getDurationBins(durations);
    const deviceStats = getDeviceAggregation(samples);
    const regionStats = getIpRegionAggregation(samples);
    const abnormalSamples = samples.filter(s => s.abnormalTypes.length > 0);

    return NextResponse.json({
      success: true,
      data: {
        channel,
        samples,
        durationBins,
        deviceStats,
        regionStats,
        abnormalSamples,
        questionGroupStats: {
          groupNames: ['基本信息', '消费习惯', '品牌认知', '购买意向', '开放题'],
          avgDurations: [45, 98, 72, 56, 120],
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '获取渠道详情失败' },
      { status: 500 }
    );
  }
}
