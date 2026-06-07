'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import type { PlatformTopicMatrix } from '@/lib/types';

interface TopicMatrixChartProps {
  data: PlatformTopicMatrix[];
}

export default function TopicMatrixChart({ data }: TopicMatrixChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [activePlatform, setActivePlatform] = useState<string>('');

  const activeData = useMemo(() => {
    const found = data.find(d => d.platform === activePlatform);
    return found || data[0] || null;
  }, [data, activePlatform]);

  useEffect(() => {
    if (!chartRef.current || !activeData) return;

    const items = activeData.items;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const dataIndex = params.dataIndex as number;
          const item = items[dataIndex];
          if (!item) return '';
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${item.tag}</div>
            <div>内容数量: ${item.count} 篇</div>
            <div>平均${activeData.primaryMetricName}: ${item.avgPrimaryMetric.toLocaleString()}</div>
            <div>平均点赞: ${item.avgLikes.toLocaleString()}</div>
            <div>互动率: ${item.avgInteractionRate}%</div>
          `;
        },
      },
      grid: {
        left: '8%',
        right: '8%',
        top: '15%',
        bottom: '15%',
      },
      xAxis: {
        name: `平均${activeData.primaryMetricName}`,
        nameLocation: 'middle',
        nameGap: 30,
        type: 'value',
        axisLabel: {
          formatter: (value: number) => {
            if (value >= 10000) return (value / 10000).toFixed(1) + 'w';
            return value.toString();
          },
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
          },
        },
      },
      yAxis: {
        name: '平均点赞量',
        nameLocation: 'middle',
        nameGap: 40,
        type: 'value',
        axisLabel: {
          formatter: (value: number) => {
            if (value >= 10000) return (value / 10000).toFixed(1) + 'w';
            return value.toString();
          },
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
          },
        },
      },
      series: [
        {
          type: 'scatter',
          data: items.map((item) => [
            item.avgPrimaryMetric,
            item.avgLikes,
            item.count * 5 + 10,
          ]),
          symbolSize: (value: number[]) => value[2],
          itemStyle: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            color: (params: any) => {
              const dataIndex = params.dataIndex as number;
              const item = items[dataIndex];
              if (!item) return '#9ca3af';
              if (item.avgInteractionRate >= 5) return '#10b981';
              if (item.avgInteractionRate >= 3) return '#3b82f6';
              if (item.avgInteractionRate >= 1.5) return '#f59e0b';
              return '#ef4444';
            },
            opacity: 0.7,
          },
          label: {
            show: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: (params: any) => {
              const dataIndex = params.dataIndex as number;
              return items[dataIndex]?.tag || '';
            },
            position: 'top',
            fontSize: 11,
            color: '#374151',
          },
          emphasis: {
            itemStyle: {
              opacity: 1,
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
          },
        },
      ],
      visualMap: {
        show: true,
        type: 'continuous',
        min: 0,
        max: 8,
        dimension: 2,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        text: ['互动率高', '互动率低'],
        textStyle: {
          fontSize: 11,
          color: '#6b7280',
        },
        inRange: {
          color: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
        },
        calculable: true,
      },
    };

    chartInstance.current.setOption(option, true);

    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeData]);

  if (!activeData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">选题矩阵</h3>
            <p className="text-sm text-gray-500 mt-1">各平台按独立口径统计，气泡大小代表内容数量，颜色代表互动率</p>
          </div>
        </div>
        <div className="h-80 flex items-center justify-center text-gray-400 text-sm">
          暂无数据
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">选题矩阵</h3>
          <p className="text-sm text-gray-500 mt-1">各平台按独立口径统计，气泡大小代表内容数量，颜色代表互动率</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span> 高互动
          <span className="w-3 h-3 rounded-full bg-blue-500 ml-2"></span> 中高
          <span className="w-3 h-3 rounded-full bg-amber-500 ml-2"></span> 中低
          <span className="w-3 h-3 rounded-full bg-red-500 ml-2"></span> 低互动
        </div>
      </div>

      {data.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {data.map((platform) => (
            <button
              key={platform.platform}
              onClick={() => setActivePlatform(platform.platform)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                activePlatform === platform.platform || (!activePlatform && platform.platform === data[0]?.platform)
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {platform.platformLabel} ({platform.primaryMetricName})
            </button>
          ))}
        </div>
      )}

      <div ref={chartRef} className="w-full h-80" />
    </div>
  );
}
