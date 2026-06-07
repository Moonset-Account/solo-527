import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useStore } from '@/store/useStore';
import { api } from '@/api';
import type { DishSatisfaction } from '@/types';

const SAMPLE_THRESHOLD = 30;

export default function SatisfactionMatrix() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [data, setData] = useState<DishSatisfaction[]>([]);
  const { filters, setSelectedDishId } = useStore();

  useEffect(() => {
    api.getSatisfaction(filters).then(setData);
  }, [filters]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const normalData: any[] = [];
    const supplierChangedData: any[] = [];
    const batchRecalledData: any[] = [];
    const lowSampleData: any[] = [];

    data.forEach((d) => {
      const point = {
        value: [d.total_sales, d.avg_score ?? 0, d.sample_count],
        dish_id: d.dish_id,
        dish_name: d.dish_name,
        window_name: d.window_name,
        cuisine_type: d.cuisine_type,
        return_rate: d.return_rate,
        cost: d.cost,
        profit_rate: d.profit_rate,
        sample_count: d.sample_count,
        avg_score: d.avg_score,
        supplier_change_day_score: d.supplier_change_day_score,
        supplier_change_dates: d.supplier_change_dates,
      };

      if (d.sample_count < SAMPLE_THRESHOLD) {
        lowSampleData.push(point);
      } else if (d.supplier_changed && d.batch_recalled) {
        supplierChangedData.push(point);
        batchRecalledData.push(point);
      } else if (d.supplier_changed) {
        supplierChangedData.push(point);
      } else if (d.batch_recalled) {
        batchRecalledData.push(point);
      } else {
        normalData.push(point);
      }
    });

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const d = params.data;
          let tags = '';
          const found = d.dish_id ? data.find((x) => x.dish_id === d.dish_id) : null;
          if (found?.supplier_changed) {
            tags += '<br/><span style="color:#D97706">◆ 供应商更换日（评分已排除更换日，不与历史混算）</span>';
            if (d.supplier_change_day_score != null) {
              tags += `<br/><span style="color:#D97706">更换日评分：${d.supplier_change_day_score}</span>`;
            }
            if (d.supplier_change_dates?.length) {
              tags += `<br/><span style="color:#D97706">更换日期：${d.supplier_change_dates.join('、')}</span>`;
            }
          }
          if (found?.batch_recalled) {
            tags += '<br/><span style="color:#7C3AED">▲ 食材批次召回</span>';
          }
          if (d.value && d.value[2] < SAMPLE_THRESHOLD) {
            tags += '<br/><span style="color:#9CA3AF">⚠ 样本不足（不参与低分排行）</span>';
          }
          const scoreLabel = found?.supplier_changed ? '历史评分（不含更换日）' : '评分';
          return `<strong>${d.dish_name || ''}</strong><br/>
窗口：${d.window_name || ''}<br/>
菜系：${d.cuisine_type || ''}<br/>
销量：${d.value ? d.value[0] : ''}<br/>
${scoreLabel}：${d.avg_score ?? '-'}<br/>
样本量：${d.value ? d.value[2] : ''}<br/>
退餐率：${d.return_rate}%<br/>
成本：¥${d.cost} | 毛利率：${d.profit_rate}%${tags}`;
        },
      },
      grid: {
        left: '8%',
        right: '12%',
        top: '12%',
        bottom: '12%',
      },
      xAxis: {
        name: '销量',
        nameLocation: 'middle',
        nameGap: 30,
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#E5E7EB' } },
      },
      yAxis: {
        name: '评分',
        nameLocation: 'middle',
        nameGap: 40,
        type: 'value',
        min: 2,
        max: 5,
        splitLine: { lineStyle: { type: 'dashed', color: '#E5E7EB' } },
      },
      series: [
        {
          name: '正常菜品',
          type: 'scatter',
          symbolSize: (val: number[]) => Math.max(8, Math.min(40, (val[2] || 1) / 10)),
          data: normalData,
          itemStyle: { color: '#0F766E', opacity: 0.75 },
          emphasis: { itemStyle: { opacity: 1, borderColor: '#0F766E', borderWidth: 2 } },
        },
        {
          name: '◆ 供应商更换',
          type: 'scatter',
          symbol: 'diamond',
          symbolSize: (val: number[]) => Math.max(10, Math.min(44, (val[2] || 1) / 10)),
          data: supplierChangedData,
          itemStyle: { color: '#D97706', opacity: 0.85 },
          emphasis: { itemStyle: { opacity: 1, borderColor: '#D97706', borderWidth: 2 } },
        },
        {
          name: '▲ 食材召回',
          type: 'scatter',
          symbol: 'triangle',
          symbolSize: (val: number[]) => Math.max(10, Math.min(44, (val[2] || 1) / 10)),
          data: batchRecalledData,
          itemStyle: { color: '#7C3AED', opacity: 0.85 },
          emphasis: { itemStyle: { opacity: 1, borderColor: '#7C3AED', borderWidth: 2 } },
        },
        {
          name: '样本不足',
          type: 'scatter',
          symbol: 'circle',
          symbolSize: (val: number[]) => Math.max(6, Math.min(24, (val[2] || 1) / 10)),
          data: lowSampleData,
          itemStyle: { color: '#D1D5DB', opacity: 0.5, borderColor: '#9CA3AF', borderWidth: 1, borderType: 'dashed' },
          emphasis: { itemStyle: { opacity: 0.8 } },
        },
      ],
      visualMap: {
        show: false,
        dimension: 2,
        min: 0,
        max: 500,
        inRange: {
          symbolSize: [8, 40],
        },
      },
      markLine: {
        silent: true,
      },
    };

    chartInstance.current.setOption(option, true);

    chartInstance.current.off('click');
    chartInstance.current.on('click', (params: any) => {
      if (params.data?.dish_id) {
        setSelectedDishId(params.data.dish_id);
      }
    });

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data, setSelectedDishId]);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-800">满意度矩阵</h3>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-teal-700 opacity-75" />
            正常
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-amber-600" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
            供应商更换
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-violet-600" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
            食材召回
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-zinc-300 border border-dashed border-zinc-400" />
            样本不足
          </span>
        </div>
      </div>
      <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
      <p className="text-xs text-zinc-400 mt-2">气泡大小代表样本量，点击菜品可查看评分趋势。供应商更换日评分已排除，不与历史口味评价混算。样本不足（&lt;{SAMPLE_THRESHOLD}）的菜品不参与低分排行。</p>
    </div>
  );
}
