import { useRef, useEffect, useState, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { EnergyBreakdownItem } from '../types';
import { apiService } from '../services/api';
import { useFilterStore } from '../stores/filterStore';

export default function EnergyBreakdownChart() {
  const chartRef = useRef<ReactECharts>(null);
  const [data, setData] = useState<EnergyBreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { timeRange, roomIds } = useFilterStore();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiService.getEnergyBreakdown({
        startTime: timeRange.start,
        endTime: timeRange.end,
        roomIds: roomIds.length > 0 ? roomIds : undefined,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to fetch energy breakdown:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, roomIds]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getChartOption = (): EChartsOption => {
    const colors = ['#165DFF', '#00B42A', '#FF7D00', '#722ED1'];
    
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#475569',
        textStyle: { color: '#F1F5F9' },
        formatter: '{b}: {c} kWh ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { color: '#94A3B8', fontSize: 12 },
        itemGap: 15
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#1E293B',
            borderWidth: 3
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 18,
              fontWeight: 'bold',
              color: '#F1F5F9'
            }
          },
          labelLine: { show: false },
          data: data.map((item, index) => ({
            value: item.value,
            name: item.category,
            itemStyle: { color: colors[index % colors.length] }
          }))
        }
      ]
    };
  };

  return (
    <div className="chart-card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">能耗构成</h3>
        <span className="text-xs text-slate-400">
          {loading ? '加载中...' : '按分类统计'}
        </span>
      </div>
      <ReactECharts
        ref={chartRef}
        option={getChartOption()}
        style={{ height: '280px' }}
        notMerge={true}
      />
    </div>
  );
}
