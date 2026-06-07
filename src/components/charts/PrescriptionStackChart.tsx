'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { HourlyPrescriptionItem } from '@/types';

interface Props {
  data: HourlyPrescriptionItem[];
  onDrillDown?: (hour: string) => void;
}

export default function PrescriptionStackChart({ data, onDrillDown }: Props) {
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
          const hour = params[0].name;
          let html = `<div style="font-weight: 600; margin-bottom: 8px;">${hour}</div>`;
          let total = 0;
          params.forEach((item: any) => {
            total += item.value;
            html += `
              <div style="display: flex; justify-content: space-between; gap: 20px; align-items: center;">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: ${item.color};"></span>
                  ${item.seriesName}
                </span>
                <span style="font-weight: 600;">${item.value}</span>
              </div>
            `;
          });
          html += `
            <div style="border-top: 1px solid #eee; margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between; gap: 20px;">
              <span>合计</span>
              <span style="font-weight: 600;">${total}</span>
            </div>
          `;
          return html;
        },
      },
      legend: {
        data: ['急诊处方', '普通处方', '专科处方'],
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
        data: data.map((d) => d.hour),
        axisLabel: {
          fontSize: 11,
          color: '#666',
          interval: 1,
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
          barWidth: '60%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#FF7D7D' },
              { offset: 1, color: '#F53F3F' },
            ]),
          },
          data: data.map((d) => d.emergency),
        },
        {
          name: '普通处方',
          type: 'bar',
          stack: 'total',
          barWidth: '60%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#6AA4FF' },
              { offset: 1, color: '#165DFF' },
            ]),
          },
          data: data.map((d) => d.normal),
        },
        {
          name: '专科处方',
          type: 'bar',
          stack: 'total',
          barWidth: '60%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#7BC68D' },
              { offset: 1, color: '#00B42A' },
            ]),
          },
          data: data.map((d) => d.specialist),
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
        <h3 className="text-base font-semibold text-gray-900">各时段处方类型分布</h3>
        <span className="text-xs text-gray-400">点击可下钻查看时段明细</span>
      </div>
      <div ref={chartRef} style={{ height: '300px', width: '100%' }} />
    </div>
  );
}
