import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useStore } from '@/store/useStore';
import { api } from '@/api';
import type { ScoreTrend } from '@/types';
import { X } from 'lucide-react';

export default function ScoreTrendChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [trend, setTrend] = useState<ScoreTrend | null>(null);
  const { selectedDishId, setSelectedDishId } = useStore();

  useEffect(() => {
    if (!selectedDishId) {
      setTrend(null);
      return;
    }
    api.getDishTrend(selectedDishId).then(setTrend);
  }, [selectedDishId]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (!trend) {
      chartInstance.current.setOption({
        title: {
          text: '点击满意度矩阵中的菜品查看评分趋势',
          left: 'center',
          top: 'center',
          textStyle: { color: '#A1A1AA', fontSize: 13, fontWeight: 'normal' },
        },
      }, true);
      return;
    }

    const markPoints: any[] = [];
    const markLines: any[] = [];

    trend.dates.forEach((d, i) => {
      if (trend.supplier_change_dates.includes(d)) {
        markPoints.push({
          coord: [i, trend.scores[i]],
          symbol: 'diamond',
          symbolSize: 14,
          itemStyle: { color: '#D97706' },
          label: { show: true, formatter: '换', fontSize: 9, color: '#fff' },
        });
      }
      if (trend.recall_dates.includes(d)) {
        markPoints.push({
          coord: [i, trend.scores[i]],
          symbol: 'triangle',
          symbolSize: 14,
          itemStyle: { color: '#7C3AED' },
          label: { show: true, formatter: '召', fontSize: 9, color: '#fff' },
        });
      }
    });

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex;
          const dateStr = trend.dates[idx];
          const score = trend.scores[idx];
          let tag = '';
          if (trend.supplier_change_dates.includes(dateStr)) {
            tag += '<br/><span style="color:#D97706">◆ 供应商更换日</span>';
          }
          if (trend.recall_dates.includes(dateStr)) {
            tag += '<br/><span style="color:#7C3AED">▲ 食材批次召回</span>';
          }
          return `${dateStr}<br/>评分：${score}${tag}`;
        },
      },
      grid: {
        left: '8%',
        right: '5%',
        top: '15%',
        bottom: '12%',
      },
      xAxis: {
        type: 'category',
        data: trend.dates,
        axisLabel: { fontSize: 9, color: '#A1A1AA', rotate: 45 },
      },
      yAxis: {
        type: 'value',
        min: 2,
        max: 5,
        axisLabel: { fontSize: 10, color: '#71717A' },
        splitLine: { lineStyle: { type: 'dashed', color: '#F4F4F5' } },
      },
      series: [
        {
          type: 'line',
          data: trend.scores,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { color: '#0F766E', width: 2 },
          itemStyle: { color: '#0F766E' },
          markPoint: {
            data: markPoints,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(15, 118, 110, 0.15)' },
              { offset: 1, color: 'rgba(15, 118, 110, 0.02)' },
            ]),
          },
        },
      ],
    };

    chartInstance.current.setOption(option, true);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [trend]);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-800">
          评分趋势{trend ? ` - ${trend.dish_name}` : ''}
        </h3>
        {selectedDishId && (
          <button
            onClick={() => setSelectedDishId(null)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
          >
            <X className="w-3.5 h-3.5" />
            关闭
          </button>
        )}
      </div>
      <div ref={chartRef} style={{ width: '100%', height: '300px' }} />
      {trend && (
        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-amber-600" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
            ◆ 供应商更换日（不与历史口味评价混算）
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-violet-600" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
            ▲ 食材批次召回
          </span>
        </div>
      )}
    </div>
  );
}
