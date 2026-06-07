'use client';

import { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { RadarChartData } from '@/lib/services/analytics';

interface RadarChartProps {
  data: RadarChartData;
  title?: string;
  height?: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function RadarChart({ data, title, height = 400 }: RadarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const option: echarts.EChartsOption = {
      title: title
        ? {
            text: title,
            left: 'center',
            textStyle: { fontSize: 14, fontWeight: 600, color: '#1f2937' },
          }
        : undefined,
      tooltip: {
        trigger: 'item',
      },
      legend: {
        data: data.series.map((s) => s.name),
        bottom: 10,
        textStyle: { fontSize: 12, color: '#6b7280' },
      },
      radar: {
        indicator: data.indicators,
        shape: 'polygon',
        splitNumber: 5,
        axisName: {
          color: '#4b5563',
          fontSize: 12,
        },
        splitLine: {
          lineStyle: { color: '#e5e7eb' },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['#f9fafb', '#f3f4f6', '#f9fafb', '#f3f4f6', '#f9fafb'],
          },
        },
        axisLine: {
          lineStyle: { color: '#d1d5db' },
        },
      },
      series: [
        {
          type: 'radar',
          data: data.series.map((s, i) => ({
            value: s.value,
            name: s.name,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
              width: 2,
              color: COLORS[i % COLORS.length],
            },
            areaStyle: {
              color: COLORS[i % COLORS.length],
              opacity: 0.15,
            },
            itemStyle: {
              color: COLORS[i % COLORS.length],
            },
          })),
        },
      ],
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
  }, [data, title]);

  return <div ref={chartRef} style={{ height }} />;
}
