import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useStore } from '@/store/useStore';
import { api } from '@/api';
import type { CostProfit } from '@/types';

export default function CostProfitChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [data, setData] = useState<CostProfit[]>([]);
  const { filters } = useStore();

  useEffect(() => {
    api.getCostProfits(filters).then(setData);
  }, [filters]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const sortedData = [...data].sort((a, b) => a.cost - b.cost);
    const dishNames = sortedData.map((d) => d.dish_name);
    const costs = sortedData.map((d) => d.cost);
    const profitRates = sortedData.map((d) => d.profit_rate);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex;
          const d = sortedData[idx];
          if (!d) return '';
          return `<strong>${d.dish_name}</strong><br/>成本：¥${d.cost}<br/>毛利率：${d.profit_rate}%<br/>销量：${d.sales}`;
        },
      },
      grid: {
        left: '6%',
        right: '8%',
        top: '10%',
        bottom: '18%',
      },
      xAxis: {
        type: 'category',
        data: dishNames,
        axisLabel: {
          rotate: 45,
          fontSize: 10,
          color: '#71717A',
        },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '成本(元)',
          nameTextStyle: { fontSize: 11, color: '#71717A' },
          axisLabel: { fontSize: 10, color: '#71717A', formatter: '¥{value}' },
          splitLine: { lineStyle: { type: 'dashed', color: '#F4F4F5' } },
        },
        {
          type: 'value',
          name: '毛利率(%)',
          nameTextStyle: { fontSize: 11, color: '#71717A' },
          axisLabel: { fontSize: 10, color: '#71717A', formatter: '{value}%' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '成本',
          type: 'bar',
          data: costs,
          barWidth: '40%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#0F766E' },
              { offset: 1, color: '#14B8A6' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: '毛利率',
          type: 'line',
          yAxisIndex: 1,
          data: profitRates,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#D97706', width: 2 },
          itemStyle: { color: '#D97706' },
        },
      ],
    };

    chartInstance.current.setOption(option, true);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data]);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-800">成本毛利图</h3>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-teal-700" />
            成本
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-amber-600 rounded" />
            毛利率
          </span>
        </div>
      </div>
      <div ref={chartRef} style={{ width: '100%', height: '340px' }} />
    </div>
  );
}
