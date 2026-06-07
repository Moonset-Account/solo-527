'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { WaitDistributionItem } from '@/types';

interface Props {
  data: WaitDistributionItem[];
  onDrillDown?: (range: string) => void;
}

export default function WaitDistributionChart({ data, onDrillDown }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = params[0];
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span>急诊处方</span>
              <span style="font-weight: 600; color: #F53F3F;">${item.data?.emergencyCount || 0}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span>普通处方</span>
              <span style="font-weight: 600; color: #165DFF;">${item.data?.normalCount || 0}</span>
            </div>
            <div style="border-top: 1px solid #eee; margin-top: 4px; padding-top: 4px; display: flex; justify-content: space-between; gap: 16px;">
              <span>总计</span>
              <span style="font-weight: 600;">${item.value}</span>
            </div>
          `;
        },
      },
      legend: {
        data: ['急诊处方', '普通处方'],
        bottom: 0,
        icon: 'roundRect',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.range),
        axisLabel: {
          fontSize: 11,
          color: '#666',
        },
        axisLine: {
          lineStyle: { color: '#E5E6EB' },
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 11,
          color: '#666',
        },
        splitLine: {
          lineStyle: { color: '#F2F3F5', type: 'dashed' },
        },
      },
      series: [
        {
          name: '急诊处方',
          type: 'bar',
          stack: 'total',
          barWidth: '50%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#FF7D7D' },
              { offset: 1, color: '#F53F3F' },
            ]),
            borderRadius: [0, 0, 0, 0],
          },
          data: data.map((d) => ({
            value: d.emergencyCount,
            emergencyCount: d.emergencyCount,
            normalCount: d.normalCount,
          })),
        },
        {
          name: '普通处方',
          type: 'bar',
          stack: 'total',
          barWidth: '50%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#6AA4FF' },
              { offset: 1, color: '#165DFF' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          data: data.map((d) => ({
            value: d.normalCount,
            emergencyCount: d.emergencyCount,
            normalCount: d.normalCount,
          })),
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleClick = (params: any) => {
      if (onDrillDown && params.name) {
        onDrillDown(params.name);
      }
    };

    chartInstance.current.on('click', handleClick);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.off('click', handleClick);
    };
  }, [data, onDrillDown]);

  return (
    <div className="bg-white rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">等待时长分布</h3>
        <span className="text-xs text-gray-400">点击柱状图可下钻查看明细</span>
      </div>
      <div ref={chartRef} style={{ height: '300px', width: '100%' }} />
    </div>
  );
}
