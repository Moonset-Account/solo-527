'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { WindowCompareItem } from '@/types';

interface Props {
  data: WindowCompareItem[];
  onDrillDown?: (windowNo: string) => void;
}

export default function WindowCompareChart({ data, onDrillDown }: Props) {
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
          const windowNo = params[0].name;
          const item = data.find((d) => d.windowNo === windowNo);
          if (!item) return '';
          return `
            <div style="font-weight: 600; margin-bottom: 8px;">${windowNo}号窗口</div>
            <div style="display: flex; justify-content: space-between; gap: 20px;">
              <span>处方总量</span>
              <span style="font-weight: 600;">${item.totalPrescriptions}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 20px;">
              <span>平均等待</span>
              <span style="font-weight: 600;">${item.avgWaitTime} 分钟</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 20px;">
              <span>平均配药</span>
              <span style="font-weight: 600;">${item.avgDispenseTime} 分钟</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 20px;">
              <span>利用率</span>
              <span style="font-weight: 600;">${item.utilization}%</span>
            </div>
          `;
        },
      },
      legend: {
        data: ['平均等待时长', '平均配药时长'],
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
        data: data.map((d) => `${d.windowNo}号`),
        axisLabel: {
          fontSize: 11,
          color: '#666',
        },
        axisLine: {
          lineStyle: { color: '#E5E6EB' },
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '时长(分钟)',
          nameTextStyle: {
            fontSize: 11,
            color: '#666',
          },
          axisLabel: {
            fontSize: 11,
            color: '#666',
          },
          splitLine: {
            lineStyle: { color: '#F2F3F5', type: 'dashed' },
          },
        },
        {
          type: 'value',
          name: '利用率(%)',
          nameTextStyle: {
            fontSize: 11,
            color: '#666',
          },
          axisLabel: {
            fontSize: 11,
            color: '#666',
            formatter: '{value}%',
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '平均等待时长',
          type: 'bar',
          barWidth: '25%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#6AA4FF' },
              { offset: 1, color: '#165DFF' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          data: data.map((d) => d.avgWaitTime),
        },
        {
          name: '平均配药时长',
          type: 'bar',
          barWidth: '25%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#FFB42C' },
              { offset: 1, color: '#FF7D00' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          data: data.map((d) => d.avgDispenseTime),
        },
        {
          name: '窗口利用率',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: '#00B42A',
          },
          itemStyle: {
            color: '#00B42A',
            borderWidth: 2,
            borderColor: '#fff',
          },
          data: data.map((d) => d.utilization),
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleClick = (params: any) => {
      if (onDrillDown && params.name) {
        onDrillDown(params.name.replace('号', ''));
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
        <h3 className="text-base font-semibold text-gray-900">窗口效率对比</h3>
        <span className="text-xs text-gray-400">点击柱状图可下钻查看明细</span>
      </div>
      <div ref={chartRef} style={{ height: '300px', width: '100%' }} />
    </div>
  );
}
