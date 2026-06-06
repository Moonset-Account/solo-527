import { useMemo, useState } from 'react';
import { ChartCard, BaseChart } from './BaseChart';
import type { ParetoResponse } from '@shared/types';
import * as echarts from 'echarts';

interface Props {
  data: ParetoResponse | null;
  loading: boolean;
  dimension?: 'category' | 'supplier' | 'store';
}

export default function ParetoChart({ data, loading, dimension = 'category' }: Props) {
  const [activeDim, setActiveDim] = useState(dimension);

  const option = useMemo((): echarts.EChartsOption => {
    if (!data || data.items.length === 0) return {};

    const topItems = data.items.slice(0, 15);

    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(71, 85, 105, 0.5)',
        textStyle: { color: '#E2E8F0' },
      },
      legend: {
        data: ['损耗金额', '累计占比'],
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
        data: topItems.map((i) => i.name),
        axisLabel: {
          color: '#94A3B8',
          fontSize: 10,
          rotate: 30,
        },
        axisLine: { lineStyle: { color: '#334155' } },
      },
      yAxis: [
        {
          type: 'value',
          name: '损耗金额',
          nameTextStyle: { color: '#94A3B8', fontSize: 10 },
          axisLabel: {
            color: '#94A3B8',
            fontSize: 10,
            formatter: (v: any) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v,
          },
          splitLine: { lineStyle: { color: '#334155' } },
        },
        {
          type: 'value',
          name: '累计占比',
          min: 0,
          max: 100,
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
          name: '损耗金额',
          type: 'bar',
          data: topItems.map((i) => ({
            value: i.lossAmount,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#EF4444CC' },
                { offset: 1, color: '#EF444444' },
              ]),
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barWidth: '50%',
        },
        {
          name: '累计占比',
          type: 'line',
          yAxisIndex: 1,
          data: topItems.map((i) => i.cumulativePercent),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#10B981', width: 2 },
          itemStyle: { color: '#10B981' },
          markLine: {
            silent: true,
            lineStyle: { color: '#F59E0B', type: 'dashed' },
            data: [{ yAxis: 80, label: { formatter: '80%', color: '#F59E0B' } }],
          },
        },
      ],
    };
  }, [data]);

  const tabs = [
    { key: 'category', label: '按品类' },
    { key: 'supplier', label: '按供应商' },
    { key: 'store', label: '按门店' },
  ];

  return (
    <ChartCard 
      title="损耗Pareto分析" 
      subtitle={
        <div className="flex items-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveDim(t.key as any)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                activeDim === t.key
                  ? 'bg-fresh-green/20 text-fresh-green'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    >
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
