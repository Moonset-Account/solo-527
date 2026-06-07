'use client';

import ReactECharts from 'echarts-for-react';

interface DurationBinsChartProps {
  bins: { label: string; count: number }[];
}

export default function DurationBinsChart({ bins }: DurationBinsChartProps) {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const data = params[0];
        return `${data.name}<br/>样本数: <strong>${data.value}</strong>`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: bins.map(b => b.label),
      axisLabel: {
        fontSize: 12,
        color: '#64748b',
      },
      axisLine: {
        lineStyle: { color: '#e2e8f0' },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 12,
        color: '#64748b',
      },
      splitLine: {
        lineStyle: { color: '#f1f5f9' },
      },
    },
    series: [
      {
        type: 'bar',
        data: bins.map((b, idx) => ({
          value: b.count,
          itemStyle: {
            color: idx === 0 ? '#f97316' : idx <= 2 ? '#3b82f6' : '#22c55e',
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barWidth: '50%',
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4">答题时长分布</h3>
      <ReactECharts option={option} style={{ height: '280px' }} />
    </div>
  );
}
