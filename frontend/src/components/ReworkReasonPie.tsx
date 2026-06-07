import React, { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { ReworkTrendPoint } from '../types';

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

interface Props {
  trendData: ReworkTrendPoint[];
}

export default function ReworkReasonPie({ trendData }: Props) {
  const reasonAgg = useMemo(() => {
    const map: Record<string, number> = {};
    trendData.forEach(d => {
      d.top_reasons.forEach(r => {
        map[r.reason] = (map[r.reason] || 0) + r.count;
      });
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [trendData]);

  const option = useMemo(() => {
    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 25, 35, 0.95)',
        borderColor: '#2a4058',
        textStyle: { color: '#e8edf2', fontSize: 12 },
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: '#8fa3b8', fontSize: 11 },
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#1e3044',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              color: '#e8edf2',
            },
          },
          data: reasonAgg.map(([name, value], idx) => ({
            name,
            value,
            itemStyle: {
              color: [
                '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
                '#ef4444', '#8b5cf6', '#f97316', '#ec4899',
              ][idx % 8],
            },
          })),
        },
      ],
    };
  }, [reasonAgg]);

  if (reasonAgg.length === 0) {
    return <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>暂无返工原因数据</div>;
  }

  return (
    <div className="chart-container">
      <ReactEChartsCore echarts={echarts} option={option} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
