import { useEffect, useState, useMemo } from 'react';
import Plotly from 'plotly.js';
import { api } from '@/services/api';
import type { DataQualityReport } from '@shared/types';
import { Database, AlertTriangle, CheckCircle, FileWarning, RefreshCw, Clock } from 'lucide-react';
import dayjs from 'dayjs';

export default function DataQuality() {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [temperatureRecords, setTemperatureRecords] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, temp] = await Promise.all([
        api.getDataQualityReport(),
        api.getTemperatureTrend(),
      ]);
      setReport(data);
      setTemperatureRecords(temp.slice(0, 500));
    } catch (error) {
      console.error('Failed to load data quality:', error);
    } finally {
      setLoading(false);
    }
  };

  const missingFieldsHeatmapData = useMemo(() => {
    if (!report?.missingFields.length) return null;
    
    const fields = report.missingFields.map(f => f.field);
    const counts = report.missingFields.map(f => f.missingCount);
    
    return { fields, counts };
  }, [report]);

  useEffect(() => {
    if (!temperatureRecords.length) return;

    const temps = temperatureRecords.map(r => r.temperature);
    
    const q1 = temps.sort((a, b) => a - b)[Math.floor(temps.length * 0.25)];
    const median = temps.sort((a, b) => a - b)[Math.floor(temps.length * 0.5)];
    const q3 = temps.sort((a, b) => a - b)[Math.floor(temps.length * 0.75)];
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    
    const outliers = temps.filter(t => t < lowerFence || t > upperFence);

    const trace: any = {
      y: [temps],
      type: 'box',
      name: '温度分布',
      boxpoints: 'outliers',
      marker: { color: '#165DFF' },
      line: { color: '#165DFF' },
    };

    const layout: any = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { t: 20, r: 20, b: 40, l: 50 },
      yaxis: {
        title: { text: '温度 (°C)', font: { color: '#64748b', size: 12 } },
        gridcolor: '#f1f5f9',
      },
      showlegend: false,
    };

    const config: any = { responsive: true, displayModeBar: false };
    
    const chartEl = document.getElementById('box-plot');
    if (chartEl) {
      Plotly.newPlot(chartEl, [trace], layout, config);
    }
  }, [temperatureRecords]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">数据完整度</p>
              <p className={`text-2xl font-bold ${
                report?.completeness >= 95 ? 'text-green-600' :
                report?.completeness >= 85 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {report?.completeness.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">温度异常点</p>
              <p className="text-2xl font-bold text-red-600">{report?.anomalyPoints}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-50 rounded-xl">
              <FileWarning className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">缺失字段数</p>
              <p className="text-2xl font-bold text-yellow-600">{report?.missingFields.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${report?.isUpdateFailed ? 'bg-red-50' : 'bg-green-50'}`}>
              {report?.isUpdateFailed ? (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">数据更新状态</p>
              <p className={`text-lg font-bold ${report?.isUpdateFailed ? 'text-red-600' : 'text-green-600'}`}>
                {report?.isUpdateFailed ? '更新失败' : '更新成功'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {report && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">数据更新信息</h3>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              刷新数据
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                最后更新时间
              </p>
              <p className="font-medium text-gray-800 mt-1">
                {dayjs(report.updateTime).format('YYYY-MM-DD HH:mm:ss')}
              </p>
            </div>
            {report.isUpdateFailed && (
              <div className="col-span-3">
                <p className="text-gray-500">错误信息</p>
                <p className="font-medium text-red-600 mt-1">{report.errorMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">缺失字段统计</h3>
          {missingFieldsHeatmapData ? (
            <div className="space-y-3">
              {missingFieldsHeatmapData.fields.map((field, i) => {
                const count = missingFieldsHeatmapData.counts[i];
                const severity = count > 50 ? 'high' : count > 20 ? 'medium' : 'low';
                return (
                  <div key={field} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-32">{field}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className={`h-full rounded-lg ${
                          severity === 'high' ? 'bg-red-500' :
                          severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, count)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {count} 条
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <p>所有字段数据完整</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">温度异常点检测（箱线图）</h3>
          <div id="box-plot" className="h-64" />
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">样本量</p>
              <p className="font-medium text-gray-800">{temperatureRecords.length} 条</p>
            </div>
            <div>
              <p className="text-gray-500">温度范围</p>
              <p className="font-medium text-gray-800">
                {temperatureRecords.length ? 
                  `${Math.min(...temperatureRecords.map(r => r.temperature)).toFixed(1)} - ${Math.max(...temperatureRecords.map(r => r.temperature)).toFixed(1)}°C`
                  : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">样本量验证</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {report?.sampleSize.map((s, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">{s.dimension}</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{s.count}</p>
              <p className={`text-xs mt-1 ${s.count < 100 ? 'text-yellow-600' : 'text-green-600'}`}>
                {s.count < 100 ? '⚠️ 样本量可能不足' : '✓ 样本量充足'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
