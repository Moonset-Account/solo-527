'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { apiClient } from '@/lib/utils/apiClient';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useFilterStore } from '@/lib/store/useFilterStore';
import type { MonitoringSite, Measurement } from '@/types';
import { INDICATORS } from '@/lib/utils/constants';

export default function TrendAnalysisPage() {
  const { user } = useAuthStore();
  const { selectedIndicator, setSelectedIndicator } = useFilterStore();
  const [sites, setSites] = useState<MonitoringSite[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string | 'all'>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const org = user?.role === 'admin' ? undefined : user?.organization;
      const [sitesData, measurementsData] = await Promise.all([
        apiClient.getSites(org) as Promise<MonitoringSite[]>,
        apiClient.getMeasurements({
          organizations: org ? [org] : undefined,
          limit: 5000,
        }) as Promise<{ data: Measurement[]; total: number }>,
      ]);
      setSites(sitesData);
      setMeasurements(measurementsData.data);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const trendData = useMemo(() => {
    let filtered = [...measurements];

    if (selectedSiteId !== 'all') {
      filtered = filtered.filter(m => m.siteId === selectedSiteId);
    }

    const grouped = new Map<string, { value: number[]; anomalies: boolean[] }>();

    filtered.forEach((m) => {
      const date = m.sampleTime.slice(0, 10);
      const value = (m as any)[selectedIndicator] as number | null;

      if (!grouped.has(date)) {
        grouped.set(date, { value: [], anomalies: [] });
      }

      if (value !== null) {
        grouped.get(date)!.value.push(value);
      }
      grouped.get(date)!.anomalies.push(m.isAnomaly);
    });

    const dates = Array.from(grouped.keys()).sort();
    const values = dates.map(date => {
      const data = grouped.get(date)!;
      if (data.value.length === 0) return null;
      return data.value.reduce((a, b) => a + b, 0) / data.value.length;
    });
    const anomalies = dates.map(date => {
      const data = grouped.get(date)!;
      return data.anomalies.some(a => a);
    });

    return { dates, values, anomalies };
  }, [measurements, selectedSiteId, selectedIndicator]);

  const chartOption = useMemo(() => {
    const indicator = INDICATORS.find(i => i.code === selectedIndicator);
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>${indicator?.name || ''}: ${data.value !== null ? data.value.toFixed(2) : '缺失'} ${indicator?.unit || ''}`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: trendData.dates,
        axisLabel: { rotate: 45, fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: indicator?.unit || '',
      },
      series: [
        {
          name: indicator?.name || '',
          type: 'line',
          data: trendData.values,
          connectNulls: false,
          itemStyle: {
            color: indicator?.color || '#0ea5e9',
          },
          lineStyle: {
            color: indicator?.color || '#0ea5e9',
            width: 2,
          },
          markLine: {
            silent: true,
            data: indicator?.standard
              ? [
                  {
                    yAxis: indicator.standard,
                    lineStyle: { color: '#ef4444', type: 'dashed' },
                    label: { formatter: `标准值: ${indicator.standard}` },
                  },
                ]
              : [],
          },
        },
        {
          name: '异常点',
          type: 'scatter',
          data: trendData.values.map((v, i) =>
            trendData.anomalies[i] && v !== null ? v : null
          ),
          itemStyle: {
            color: '#ef4444',
          },
          symbolSize: 10,
        },
      ],
    };
  }, [trendData, selectedIndicator]);

  const anomaliesList = useMemo(() => {
    return measurements
      .filter(m => m.isAnomaly)
      .sort((a, b) => new Date(b.sampleTime).getTime() - new Date(a.sampleTime).getTime())
      .slice(0, 10);
  }, [measurements]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">趋势分析</h1>
            <p className="text-slate-500 mt-1">加载中...</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="h-80 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">趋势分析</h1>
          <p className="text-slate-500 mt-1">多维度指标趋势与异常点分析</p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {INDICATORS.map((ind) => (
          <button
            key={ind.code}
            onClick={() => setSelectedIndicator(ind.code)}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedIndicator === ind.code
                ? 'border-cyan-500 bg-cyan-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ind.color }}
              />
              <span className="font-medium text-slate-700">{ind.name}</span>
            </div>
            <p className="text-xs text-slate-500">标准值: {ind.standard} {ind.unit}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-600" />
              趋势图表
            </h3>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">全部站点</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          <div className="h-80">
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">
            缺测点不连线（connectNulls: false），异常点红色标记
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            最近异常点
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
            {anomaliesList.length > 0 ? (
              anomaliesList.map((m) => {
                const site = sites.find(s => s.id === m.siteId);
                return (
                  <div
                    key={m.id}
                    className="p-3 bg-rose-50 rounded-lg border border-rose-100"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-slate-700">
                        {site?.name || '未知站点'}
                      </p>
                      <span className="text-xs text-rose-600 font-medium px-2 py-0.5 bg-rose-100 rounded">
                        异常
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      {new Date(m.sampleTime).toLocaleString('zh-CN')}
                    </p>
                    <div className="grid grid-cols-4 gap-1 text-xs">
                      {m.temperature !== null && (
                        <span className="text-slate-600">水温: {m.temperature.toFixed(1)}</span>
                      )}
                      {m.ph !== null && <span className="text-slate-600">pH: {m.ph.toFixed(2)}</span>}
                      {m.dissolvedOxygen !== null && (
                        <span className="text-slate-600">DO: {m.dissolvedOxygen.toFixed(2)}</span>
                      )}
                      {m.ammoniaNitrogen !== null && (
                        <span className="text-slate-600">氨氮: {m.ammoniaNitrogen.toFixed(3)}</span>
                      )}
                    </div>
                    {m.anomalyReason && (
                      <p className="text-xs text-slate-400 mt-2">原因: {m.anomalyReason}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">暂无异常数据</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
