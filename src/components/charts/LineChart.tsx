'use client';

import { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { TrendDataPoint } from '@/lib/services/analytics';

interface LineChartProps {
  datasets: {
    name: string;
    data: TrendDataPoint[];
    color?: string;
  }[];
  title?: string;
  yAxisName?: string;
  height?: number;
  yMin?: number;
  yMax?: number;
}

export default function LineChart({
  datasets,
  title,
  yAxisName,
  height = 350,
  yMin = 0,
  yMax = 100,
}: LineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const allLabels = datasets[0]?.data.map((d) => d.label) || [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    const option: echarts.EChartsOption = {
      title: title
        ? {
            text: title,
            left: 'center',
            textStyle: { fontSize: 14, fontWeight: 600, color: '#1f2937' },
          }
        : undefined,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
          },
        },
      },
      legend: {
        data: datasets.map((d) => d.name),
        bottom: 10,
        textStyle: { fontSize: 12, color: '#6b7280' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: title ? '15%' : '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: allLabels,
        axisLabel: { color: '#6b7280', fontSize: 11 },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
      },
      yAxis: {
        type: 'value',
        name: yAxisName,
        min: yMin,
        max: yMax,
        axisLabel: { color: '#6b7280', fontSize: 11 },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      series: datasets.map((ds, i) => ({
        name: ds.name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: ds.color || colors[i % colors.length],
        },
        itemStyle: {
          color: ds.color || colors[i % colors.length],
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: (ds.color || colors[i % colors.length]) + '40',
            },
            {
              offset: 1,
              color: (ds.color || colors[i % colors.length]) + '05',
            },
          ]),
        },
        data: ds.data.map((d) => d.value),
      })),
    };

    chartInstance.current.setOption(option);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [datasets, title, yAxisName, yMin, yMax]);

  return <div ref={chartRef} style={{ height }} />;
}
