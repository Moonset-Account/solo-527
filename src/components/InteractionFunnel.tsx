'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { FunnelItem } from '@/lib/types';

interface InteractionFunnelProps {
  data: FunnelItem[];
}

export default function InteractionFunnel({ data }: InteractionFunnelProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const dataIndex = params.dataIndex as number;
          const item = data[dataIndex];
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
            <div>数量: ${item.value.toLocaleString()}</div>
            <div>占曝光比例: ${item.rate}%</div>
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
          max: data[0]?.value || 100,
          minSize: '20%',
          maxSize: '100%',
          sort: 'descending',
          gap: 3,
          label: {
            show: true,
            position: 'inside',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: (params: any) => {
              const dataIndex = params.dataIndex as number;
              const item = data[dataIndex];
              return `{name|${item.name}}\n{value|${item.value.toLocaleString()}}`;
            },
            rich: {
              name: {
                fontSize: 13,
                fontWeight: 'bold',
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
              type: 'solid',
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
          data: data.map((item, index) => ({
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
  }, [data]);

  const conversionRates = data.map((item, index) => {
    if (index === 0) return null;
    const prev = data[index - 1].value;
    return prev > 0 ? Number(((item.value / prev) * 100).toFixed(2)) : 0;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">互动漏斗</h3>
          <p className="text-sm text-gray-500 mt-1">从曝光到评论的用户转化路径</p>
        </div>
      </div>
      <div ref={chartRef} className="w-full h-72" />
      <div className="mt-4 grid grid-cols-4 gap-2">
        {conversionRates.slice(1).map((rate, index) => (
          <div key={index} className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">
              {data[index + 1]?.name}转化率
            </div>
            <div className="text-lg font-semibold text-blue-600">
              {rate}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
