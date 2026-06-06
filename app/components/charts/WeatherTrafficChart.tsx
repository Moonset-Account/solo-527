import { useMemo } from 'react';
import * as echarts from 'echarts';
import { ChartCard, BaseChart } from './BaseChart';
import type { WeatherTrafficResponse } from '@shared/types';

interface Props {
  data: WeatherTrafficResponse | null;
  loading: boolean;
}

export default function WeatherTrafficChart({ data, loading }: Props) {
  const option = useMemo((): echarts.EChartsOption => {
    if (!data || data.items.length === 0) return {};

    const dates = data.items.map((i) => i.date.slice(5));
    const lossAmounts = data.items.map((i) => i.lossAmount);
    const customerCounts = data.items.map((i) => i.customerCount);
    const rainfalls = data.items.map((i) => i.rainfall);

    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'cross' as const },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(71, 85, 105, 0.5)',
        textStyle: { color: '#E2E8F0' },
      },
      legend: {
        data: ['损耗金额', '门店客流', '降雨量'],
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
        data: dates,
        axisLabel: {
          color: '#94A3B8',
          fontSize: 10,
        },
        axisLine: { lineStyle: { color: '#334155' } },
      },
      yAxis: [
        {
          type: 'value' as const,
          name: '损耗金额',
          position: 'left',
          nameTextStyle: { color: '#94A3B8', fontSize: 10 },
          axisLabel: {
            color: '#94A3B8',
            fontSize: 10,
            formatter: (v: any) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v,
          },
          splitLine: { lineStyle: { color: '#334155' } },
        },
        {
          type: 'value' as const,
          name: '客流/降雨',
          position: 'right',
          nameTextStyle: { color: '#94A3B8', fontSize: 10 },
          axisLabel: {
            color: '#94A3B8',
            fontSize: 10,
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '损耗金额',
          type: 'bar',
          data: lossAmounts,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#EF4444CC' },
              { offset: 1, color: '#EF444444' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: '30%',
        },
        {
          name: '门店客流',
          type: 'line',
          yAxisIndex: 1,
          data: customerCounts,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: '#3B82F6', width: 2 },
          itemStyle: { color: '#3B82F6' },
        },
        {
          name: '降雨量',
          type: 'line',
          yAxisIndex: 1,
          data: rainfalls,
          smooth: true,
          symbol: 'diamond',
          symbolSize: 6,
          lineStyle: { color: '#06B6D4', width: 2, type: 'dashed' },
          itemStyle: { color: '#06B6D4' },
        },
      ],
    };
  }, [data]);

  const correlationLabels: Record<string, { label: string; value: number }> = data ? {
    rainfallVsLoss: { label: '降雨 vs 损耗', value: data.correlation.rainfallVsLoss },
    temperatureVsLoss: { label: '气温 vs 损耗', value: data.correlation.temperatureVsLoss },
    trafficVsLoss: { label: '客流 vs 损耗', value: data.correlation.trafficVsLoss },
    weatherVsTraffic: { label: '天气 vs 客流', value: data.correlation.weatherVsTraffic },
  } : {};

  return (
    <ChartCard 
      title="天气·客流·损耗关联分析" 
      subtitle="展示降雨量、气温、门店客流与损耗金额的相关性"
    >
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-fresh-green rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <BaseChart option={option} height={250} />
          
          {data && (
            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/50">
              {Object.entries(correlationLabels).map(([key, item]) => (
                <div key={key} className="text-center">
                  <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                  <p className={`text-lg font-display font-bold ${
                    item.value > 0.5 ? 'text-loss-red' : 
                    item.value < -0.5 ? 'text-fresh-green' : 'text-warning-orange'
                  }`}>
                    {item.value > 0 ? '+' : ''}{(item.value * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-slate-500">相关系数</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </ChartCard>
  );
}
