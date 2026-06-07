import React, { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { ShiftComparisonItem } from '../types';

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface Props {
  data: ShiftComparisonItem[];
}

const SHIFT_LABELS: Record<string, string> = {
  morning: '早班',
  afternoon: '中班',
  evening: '晚班',
};

export default function ShiftComparison({ data }: Props) {
  const option = useMemo(() => {
    const shifts = data.map(d => SHIFT_LABELS[d.shift] || d.shift);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 25, 35, 0.95)',
        borderColor: '#2a4058',
        textStyle: { color: '#e8edf2', fontSize: 12 },
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['VIP平均时长', '普通平均时长', 'VIP返工率', '普通返工率'],
        top: 0,
        textStyle: { color: '#8fa3b8', fontSize: 11 },
      },
      grid: {
        left: 60,
        right: 60,
        top: 50,
        bottom: 30,
      },
      xAxis: {
        type: 'category',
        data: shifts,
        axisLabel: { color: '#8fa3b8', fontSize: 12 },
        axisLine: { lineStyle: { color: '#2a4058' } },
      },
      yAxis: [
        {
          type: 'value',
          name: '时长(min)',
          nameTextStyle: { color: '#8fa3b8', fontSize: 11 },
          axisLabel: { color: '#8fa3b8', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(42,64,88,0.5)' } },
        },
        {
          type: 'value',
          name: '返工率(%)',
          nameTextStyle: { color: '#8fa3b8', fontSize: 11 },
          axisLabel: { color: '#8fa3b8', fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'VIP平均时长',
          type: 'bar',
          data: data.map(d => d.avg_duration_vip),
          barWidth: 28,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: 'rgba(245,158,11,0.4)' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: '普通平均时长',
          type: 'bar',
          data: data.map(d => d.avg_duration_normal),
          barWidth: 28,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: 'rgba(59,130,246,0.4)' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: 'VIP返工率',
          type: 'bar',
          yAxisIndex: 1,
          data: data.map(d => d.rework_rate_vip),
          barWidth: 16,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#8b5cf6' },
              { offset: 1, color: 'rgba(139,92,246,0.4)' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: '普通返工率',
          type: 'bar',
          yAxisIndex: 1,
          data: data.map(d => d.rework_rate_normal),
          barWidth: 16,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#06b6d4' },
              { offset: 1, color: 'rgba(6,182,212,0.4)' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [data]);

  return (
    <div className="chart-container">
      <ReactEChartsCore echarts={echarts} option={option} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
