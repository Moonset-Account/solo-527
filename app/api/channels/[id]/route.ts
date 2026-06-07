import { NextResponse } from 'next/server';
import * as dataAccess from '@/lib/dataAccess';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const channel = await dataAccess.getChannelById(params.id);
    
    if (!channel) {
      return NextResponse.json(
        { success: false, error: '渠道不存在' },
        { status: 404 }
      );
    }

    const samples = await dataAccess.getSamplesByChannel(params.id);
    const durationBins = await dataAccess.getDurationBins(params.id);
    const deviceStats = await dataAccess.getDeviceAggregation(params.id);
    const regionStats = await dataAccess.getIpRegionAggregation(params.id);
    const abnormalSamples = await dataAccess.getAbnormalSamples(params.id);

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
    console.error('获取渠道详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取渠道详情失败' },
      { status: 500 }
    );
  }
}
