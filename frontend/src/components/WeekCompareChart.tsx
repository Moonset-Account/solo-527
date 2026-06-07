import { useRef, useEffect, useState, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { WeekCompareData } from '../types';
import { apiService } from '../services/api';
import { useFilterStore } from '../stores/filterStore';
import dayjs from 'dayjs';

export default function WeekCompareChart() {
  const chartRef = useRef<ReactECharts>(null);
  const [data, setData] = useState<WeekCompareData | null>(null);
  const [loading, setLoading] = useState(true);
  const { roomIds, includeMaintenance } = useFilterStore();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.compareWeeks({
        roomIds: roomIds.length > 0 ? roomIds : undefined,
        includeMaintenance,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to fetch week compare data:', error);
    } finally {
      setLoading(false);
    }
  }, [roomIds, includeMaintenance]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getChartOption = (): EChartsOption => {
    if (!data) return {};

    const examTimes = data.examWeek.map(d => d.time);
    const examValues = data.examWeek.map(d => d.value);
    const normalValues = data.normalWeek.map(d => d.value);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#475569',
        textStyle: { color: '#F1F5F9' }
      },
      legend: {
        data: ['考试周', '普通周'],
        textStyle: { color: '#94A3B8' },
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 35,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: examTimes,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94A3B8', fontSize: 10 },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '能耗 (kW)',
        nameTextStyle: { color: '#94A3B8' },
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
      },
      series: [
        {
          name: '考试周',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: examValues,
          lineStyle: { color: '#F53F3F', width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245, 63, 63, 0.2)' },
                { offset: 1, color: 'rgba(245, 63, 63, 0.02)' }
              ]
            }
          }
        },
        {
          name: '普通周',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: normalValues,
          lineStyle: { color: '#00B42A', width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 180, 42, 0.2)' },
                { offset: 1, color: 'rgba(0, 180, 42, 0.02)' }
              ]
            }
          }
        }
      ]
    };
  };

  return (
    <div className="chart-card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">周对比分析</h3>
        {data && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">差异:</span>
            <span className={`text-xs font-semibold ${
              data.differencePercent > 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              {data.differencePercent > 0 ? '+' : ''}{data.differencePercent}%
            </span>
          </div>
        )}
      </div>
      
      {data && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
            <p className="text-xs text-slate-400">考试周总能耗</p>
            <p className="text-lg font-bold text-red-400">{data.examTotal.toFixed(1)} <span className="text-xs font-normal">kWh</span></p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
            <p className="text-xs text-slate-400">普通周总能耗</p>
            <p className="text-lg font-bold text-green-400">{data.normalTotal.toFixed(1)} <span className="text-xs font-normal">kWh</span></p>
          </div>
        </div>
      )}

      <ReactECharts
        ref={chartRef}
        option={getChartOption()}
        style={{ height: '250px' }}
        notMerge={true}
      />
    </div>
  );
}
