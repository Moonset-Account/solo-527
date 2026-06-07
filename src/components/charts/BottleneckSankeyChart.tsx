'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { SankeyData } from '@/types';

interface Props {
  data: SankeyData;
  onDrillDown?: (node: string) => void;
}

export default function BottleneckSankeyChart({ data, onDrillDown }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const colors = ['#165DFF', '#00B42A', '#FF7D00', '#722ED1', '#F53F3F', '#86909C'];

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: (params: any) => {
          if (params.dataType === 'edge') {
            const sourceName = data.nodes[params.data.source]?.name;
            const targetName = data.nodes[params.data.target]?.name;
            return `
              <div style="font-weight: 600; margin-bottom: 8px;">${sourceName} → ${targetName}</div>
              <div style="display: flex; justify-content: space-between; gap: 20px;">
                <span>流转量</span>
                <span style="font-weight: 600;">${params.data.value}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 20px;">
                <span>平均耗时</span>
                <span style="font-weight: 600;">${params.data.avgDuration} 分钟</span>
              </div>
            `;
          }
          return `<div style="font-weight: 600;">${params.name}</div>`;
        },
      },
      series: [
        {
          type: 'sankey',
          layout: 'none' as any,
          emphasis: {
            focus: 'adjacency' as any,
          },
          nodeAlign: 'left' as any,
          data: data.nodes.map((node, index) => ({
            ...node,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: colors[index % colors.length] },
                { offset: 1, color: echarts.color.modifyAlpha(colors[index % colors.length], 0.7) as string },
              ]),
            },
          })),
          links: data.links.map((link) => ({
            ...link,
            lineStyle: {
              color: 'source',
              curveness: 0.5,
              opacity: 0.4,
            },
          })),
          nodeWidth: 20,
          nodeGap: 12,
          layoutIterations: 32,
          label: {
            fontSize: 12,
            fontWeight: 500,
            color: '#1D2129',
          },
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
        <h3 className="text-base font-semibold text-gray-900">处方流程瓶颈桑基图</h3>
        <span className="text-xs text-gray-400">点击节点可下钻分析</span>
      </div>
      <div ref={chartRef} style={{ height: '400px', width: '100%' }} />
    </div>
  );
}
