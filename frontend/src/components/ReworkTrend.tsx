import React, { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { ReworkTrendPoint } from '../types';

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

interface Props {
  data: ReworkTrendPoint[];
}

export default function ReworkTrend({ data }: Props) {
  const option = useMemo(() => {
    const dates = data.map(d => d.date);
    const vipRates = data.map(d => d.rework_rate_vip);
    const normalRates = data.map(d => d.rework_rate_normal);
    const totalRates = data.map(d => d.rework_rate_total);
    const vipDurations = data.map(d => d.avg_duration_vip);
    const normalDurations = data.map(d => d.avg_duration_normal);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 25, 35, 0.95)',
        borderColor: '#2a4058',
        textStyle: { color: '#e8edf2', fontSize: 12 },
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['VIP返工率', '普通返工率', '总返工率', 'VIP平均时长', '普通平均时长'],
        top: 0,
        textStyle: { color: '#8fa3b8', fontSize: 11 },
      },
      grid: {
        left: 60,
        right: 60,
        top: 50,
        bottom: 50,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { color: '#8fa3b8', fontSize: 10, rotate: 30 },
        axisLine: { lineStyle: { color: '#2a4058' } },
      },
      yAxis: [
        {
          type: 'value',
          name: '返工率(%)',
          nameTextStyle: { color: '#8fa3b8', fontSize: 11 },
          axisLabel: { color: '#8fa3b8', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(42,64,88,0.5)' } },
        },
        {
          type: 'value',
          name: '时长(min)',
          nameTextStyle: { color: '#8fa3b8', fontSize: 11 },
          axisLabel: { color: '#8fa3b8', fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
      ],
      series: [
        {
          name: 'VIP返工率',
          type: 'line',
          data: vipRates,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#f59e0b' },
          itemStyle: { color: '#f59e0b' },
        },
        {
          name: '普通返工率',
          type: 'line',
          data: normalRates,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#3b82f6' },
          itemStyle: { color: '#3b82f6' },
        },
        {
          name: '总返工率',
          type: 'line',
          data: totalRates,
          smooth: true,
          symbol: 'diamond',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#ef4444', type: 'dashed' },
          itemStyle: { color: '#ef4444' },
        },
        {
          name: 'VIP平均时长',
          type: 'bar',
          yAxisIndex: 1,
          data: vipDurations,
          barWidth: 8,
          itemStyle: { color: 'rgba(245, 158, 11, 0.3)', borderRadius: [2, 2, 0, 0] },
        },
        {
          name: '普通平均时长',
          type: 'bar',
          yAxisIndex: 1,
          data: normalDurations,
          barWidth: 8,
          itemStyle: { color: 'rgba(59, 130, 246, 0.3)', borderRadius: [2, 2, 0, 0] },
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
