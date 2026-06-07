'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { HeatmapDataItem } from '@/lib/types';
import { WEEKDAYS } from '@/lib/types';

interface PublishHeatmapProps {
  data: HeatmapDataItem[];
}

export default function PublishHeatmap({ data }: PublishHeatmapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    const option: echarts.EChartsOption = {
      tooltip: {
        position: 'top',
        formatter: (params: echarts.TooltipFormatterCallbackParams) => {
          const value = params.value as number[];
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${WEEKDAYS[value[1]]} ${value[0]}:00</div>
            <div>发布数量: ${value[2]} 篇</div>
          `;
        },
      },
      grid: {
        left: '10%',
        right: '8%',
        top: '8%',
        bottom: '15%',
      },
      xAxis: {
        type: 'category',
        data: hours,
        splitArea: {
          show: true,
        },
        axisLabel: {
          fontSize: 10,
          color: '#6b7280',
          interval: 2,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'category',
        data: WEEKDAYS,
        splitArea: {
          show: true,
        },
        axisLabel: {
          fontSize: 11,
          color: '#6b7280',
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
      },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#f0f9ff', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'],
        },
        textStyle: {
          fontSize: 10,
          color: '#6b7280',
        },
      },
      series: [
        {
          name: '发布数量',
          type: 'heatmap',
          data: data.map((d) => [d.hour, d.weekday, d.value]),
          label: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
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
    };
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">发布时间热力图</h3>
          <p className="text-sm text-gray-500 mt-1">按星期和小时统计内容发布分布</p>
        </div>
      </div>
      <div ref={chartRef} className="w-full h-72" />
    </div>
  );
}
