import { useMemo } from 'react';
import * as echarts from 'echarts';
import { ChartCard, BaseChart } from './BaseChart';
import type { PromotionResponse } from '@shared/types';

interface Props {
  data: PromotionResponse | null;
  loading: boolean;
}

export default function PromotionChart({ data, loading }: Props) {
  const option = useMemo((): echarts.EChartsOption => {
    if (!data || data.comparisons.length === 0) return {};

    const categories = data.comparisons.slice(0, 8).map((c) => c.categoryName);

    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(71, 85, 105, 0.5)',
        textStyle: { color: '#E2E8F0' },
      },
      legend: {
        data: ['促销前日销', '促销期日销', '临期率改善'],
        textStyle: { color: '#94A3B8', fontSize: 11 },
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 40,
        containLabel: true,
      },
      xAxis: {
        type: 'category' as const,
        data: categories,
        axisLabel: {
          color: '#94A3B8',
          fontSize: 10,
        },
        axisLine: { lineStyle: { color: '#334155' } },
      },
      yAxis: [
        {
          type: 'value',
          name: '日销量',
          nameTextStyle: { color: '#94A3B8', fontSize: 10 },
          axisLabel: { color: '#94A3B8', fontSize: 10 },
          splitLine: { lineStyle: { color: '#334155' } },
        },
        {
          type: 'value',
          name: '改善幅度',
          min: -50,
          max: 50,
          nameTextStyle: { color: '#94A3B8', fontSize: 10 },
          axisLabel: {
            color: '#94A3B8',
            fontSize: 10,
            formatter: '{value}%',
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '促销前日销',
          type: 'bar',
          data: data.comparisons.slice(0, 8).map((c) => c.beforePeriod.dailyAvgSales.toFixed(1)),
          itemStyle: { color: '#64748B', borderRadius: [4, 4, 0, 0] },
          barWidth: '20%',
        },
        {
          name: '促销期日销',
          type: 'bar',
          data: data.comparisons.slice(0, 8).map((c) => c.duringPeriod.dailyAvgSales.toFixed(1)),
          itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] },
          barWidth: '20%',
        },
        {
          name: '临期率改善',
          type: 'line',
          yAxisIndex: 1,
          data: data.comparisons.slice(0, 8).map((c) => (c.improvement.expiryRateChange * 100).toFixed(1)),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#F59E0B', width: 2 },
          itemStyle: { color: '#F59E0B' },
        },
      ],
    };
  }, [data]);

  return (
    <ChartCard title="促销效果对比" subtitle="促销前后的销量、损耗和临期率变化">
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-fresh-green rounded-full animate-spin" />
        </div>
      ) : (
        <BaseChart option={option} height={300} />
      )}
    </ChartCard>
  );
}
