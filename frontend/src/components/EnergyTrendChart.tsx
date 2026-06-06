import { useRef, useEffect, useState, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import type { EnergyTrendPoint, AnomalyPoint } from '../types';
import { apiService } from '../services/api';
import { useFilterStore } from '../stores/filterStore';

interface EnergyTrendChartProps {
  onAnomalyClick?: (anomalyId: string) => void;
}

export default function EnergyTrendChart({ onAnomalyClick }: EnergyTrendChartProps) {
  const chartRef = useRef<ReactECharts>(null);
  const [data, setData] = useState<EnergyTrendPoint[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { timeRange, roomIds, includeMaintenance } = useFilterStore();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [trendData, anomalyData] = await Promise.all([
        apiService.getEnergyTrend({
          startTime: timeRange.start,
          endTime: timeRange.end,
          roomIds: roomIds.length > 0 ? roomIds : undefined,
          includeMaintenance,
        }),
        apiService.getAnomalies({
          startTime: timeRange.start,
          endTime: timeRange.end,
          roomIds: roomIds.length > 0 ? roomIds : undefined,
        }),
      ]);
      setData(trendData);
      setAnomalies(anomalyData as AnomalyPoint[]);
    } catch (error) {
      console.error('Failed to fetch energy trend:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, roomIds, includeMaintenance]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getChartOption = (): EChartsOption => {
    const totalData = data
      .filter(d => d.category === 'total' && !d.isOffline)
      .map(d => [dayjs(d.timestamp).format('MM-DD HH:mm'), d.value]);
    
    const acData = data
      .filter(d => d.category === 'ac' && !d.isOffline)
      .map(d => [dayjs(d.timestamp).format('MM-DD HH:mm'), d.value]);
    
    const serverData = data
      .filter(d => d.category === 'server' && !d.isOffline)
      .map(d => [dayjs(d.timestamp).format('MM-DD HH:mm'), d.value]);

    const offlineMarks = data
      .filter(d => d.isOffline)
      .map(d => ({
        xAxis: dayjs(d.timestamp).format('MM-DD HH:mm'),
        yAxis: 0,
        itemStyle: { color: '#F53F3F' }
      }));

    const anomalyMarkPoints = anomalies.slice(0, 20).map(a => ({
      name: '异常点',
      xAxis: dayjs(a.timestamp).format('MM-DD HH:mm'),
      yAxis: a.value,
      value: a.severity,
      itemStyle: {
        color: a.severity === 'high' ? '#F53F3F' : a.severity === 'medium' ? '#FF7D00' : '#FFC53D'
      },
      anomalyId: a.id
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#475569',
        textStyle: { color: '#F1F5F9' },
        axisPointer: {
          type: 'cross',
          lineStyle: { color: '#475569' }
        }
      },
      legend: {
        data: ['总能耗', '空调能耗', '服务器能耗'],
        textStyle: { color: '#94A3B8' },
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 40,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
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
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          height: 20,
          bottom: 5,
          borderColor: 'transparent',
          backgroundColor: '#1E293B',
          fillerColor: 'rgba(22, 93, 255, 0.2)',
          handleStyle: { color: '#165DFF' },
          textStyle: { color: '#94A3B8' }
        }
      ],
      series: [
        {
          name: '总能耗',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: totalData,
          lineStyle: { color: '#165DFF', width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(22, 93, 255, 0.3)' },
                { offset: 1, color: 'rgba(22, 93, 255, 0.02)' }
              ]
            }
          },
          markPoint: {
            symbol: 'circle',
            symbolSize: 12,
            data: anomalyMarkPoints,
            label: { show: false }
          }
        },
        {
          name: '空调能耗',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: acData,
          lineStyle: { color: '#00B42A', width: 1.5 },
        },
        {
          name: '服务器能耗',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: serverData,
          lineStyle: { color: '#FF7D00', width: 1.5 },
        }
      ]
    };
  };

  const onChartClick = (params: any) => {
    if (params.componentType === 'markPoint') {
      const anomaly = anomalies.find(a => 
        dayjs(a.timestamp).format('MM-DD HH:mm') === params.data.xAxis &&
        Math.abs(a.value - params.data.yAxis) < 1
      );
      if (anomaly && onAnomalyClick) {
        onAnomalyClick(anomaly.id);
      }
    }
  };

  return (
    <div className="chart-card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">能耗趋势</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {loading ? '加载中...' : `${data.length} 个数据点`}
          </span>
          {anomalies.length > 0 && (
            <span className="badge-danger">
              {anomalies.length} 个异常
            </span>
          )}
        </div>
      </div>
      <ReactECharts
        ref={chartRef}
        option={getChartOption()}
        style={{ height: '350px' }}
        onEvents={{ click: onChartClick }}
        notMerge={true}
      />
    </div>
  );
}
