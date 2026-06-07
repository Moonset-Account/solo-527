'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import type { PlatformFunnelData } from '@/lib/types';

interface PlatformFunnelChartProps {
  data: PlatformFunnelData[];
}

export default function PlatformFunnelChart({ data }: PlatformFunnelChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [activePlatform, setActivePlatform] = useState<string>('');

  const activeData = useMemo(() => {
    const found = data.find(d => d.platform === activePlatform);
    return found || data[0] || null;
  }, [data, activePlatform]);

  useEffect(() => {
    if (!chartRef.current || !activeData) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: echarts.TooltipFormatterCallbackParams) => {
          const dataIndex = params.dataIndex as number;
          const item = activeData.funnel[dataIndex];
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
            <div>数量: ${item.value.toLocaleString()}</div>
            <div>占${activeData.primaryMetric}比例: ${item.rate}%</div>
          `;
        },
      },
      legend: {
        show: false,
      },
      series: [
        {
          type: 'funnel',
          left: '10%',
          top: 20,
          bottom: 20,
          width: '80%',
          min: 0,
          max: activeData.funnel[0]?.value || 100,
          minSize: '20%',
          maxSize: '100%',
          sort: 'descending',
          gap: 3,
          label: {
            show: true,
            position: 'inside',
            formatter: (params: echarts.DefaultLabelFormatterCallbackParams) => {
              const dataIndex = params.dataIndex as number;
              const item = activeData.funnel[dataIndex];
              return `{name|${item.name}}\n{value|${item.value.toLocaleString()}}`;
            },
            rich: {
              name: {
                fontSize: 13,
                fontWeight: 'bold' as const,
                color: '#fff',
                lineHeight: 20,
              },
              value: {
                fontSize: 11,
                color: 'rgba(255,255,255,0.9)',
              },
            },
          },
          labelLine: {
            length: 10,
            lineStyle: {
              width: 1,
              type: 'solid' as const,
            },
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2,
          },
          emphasis: {
            label: {
              fontSize: 15,
            },
          },
          data: activeData.funnel.map((item, index) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: colors[index % colors.length],
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
    };
  }, [activeData]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">互动漏斗</h3>
            <p className="text-sm text-gray-500 mt-1">按平台分口径展示转化路径</p>
          </div>
        </div>
        <div className="h-72 flex items-center justify-center text-gray-400">
          暂无数据
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">互动漏斗</h3>
          <p className="text-sm text-gray-500 mt-1">按平台分口径展示转化路径</p>
        </div>
        <div className="flex gap-2">
          {data.map((item) => (
            <button
              key={item.platform}
              onClick={() => setActivePlatform(item.platform)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                activePlatform === item.platform
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.platformLabel}
            </button>
          ))}
        </div>
      </div>

      {activeData && (
        <>
          <div className="mb-2 text-sm text-gray-500">
            核心指标: <span className="font-medium text-gray-700">{activeData.primaryMetric}</span>
            <span className="mx-2">·</span>
            样本量: <span className="font-medium text-gray-700">{activeData.funnel[0]?.value.toLocaleString() || 0}</span>
          </div>
          <div ref={chartRef} className="w-full h-72" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {activeData.conversionRates.map((rate, index) => (
              <div key={index} className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">
                  {activeData.funnel[index + 1]?.name}转化率
                </div>
                <div className="text-lg font-semibold text-blue-600">
                  {rate}%
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
