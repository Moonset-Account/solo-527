import { useEffect, useState, useMemo } from 'react';
import FilterBar from '@/components/filters/FilterBar';
import { api } from '@/services/api';
import { useMetaStore } from '@/store';
import type { CompareMetrics } from '@shared/types';
import { BarChart3, TrendingUp, CheckCircle, Clock, AlertTriangle, Download } from 'lucide-react';

export default function Compare() {
  const [dimension, setDimension] = useState<'vehicle' | 'route' | 'customer' | 'batch' | 'probe'>('vehicle');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<CompareMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { vehicles, routes, customers, batches, probes } = useMetaStore();

  const options = useMemo(() => {
    if (dimension === 'vehicle') return vehicles.map(v => ({ id: v.id, name: v.plateNumber }));
    if (dimension === 'route') return routes.map(r => ({ id: r.id, name: r.name }));
    if (dimension === 'batch') return batches.map(b => ({ id: b.id, name: `批次${b.batchNo || b.id.slice(0, 8)}` }));
    if (dimension === 'probe') return probes.map(p => ({ id: p.id, name: p.probeCode }));
    return customers.map(c => ({ id: c.id, name: c.name }));
  }, [dimension, vehicles, routes, customers, batches, probes]);

  useEffect(() => {
    if (selectedIds.length > 0) {
      loadCompareData();
    } else {
      setCompareData(null);
    }
  }, [dimension, selectedIds]);

  const loadCompareData = async () => {
    setLoading(true);
    try {
      const data = await api.getCompareMetrics(dimension, selectedIds, []);
      setCompareData(data);
    } catch (error) {
      console.error('Failed to load compare data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const getMaxValue = (key: keyof CompareMetrics['items'][0]) => {
    if (!compareData) return 0;
    return Math.max(...compareData.items.map(i => Number(i[key]) || 0));
  };

  const getBarWidth = (value: number, key: keyof CompareMetrics['items'][0]) => {
    const max = getMaxValue(key);
    if (max === 0) return '0%';
    return `${Math.min(100, (value / max) * 100)}%`;
  };

  return (
    <div>
      <FilterBar />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">选择对比维度</h3>
            
            <div className="flex gap-2 mb-4 flex-wrap">
              {(['vehicle', 'route', 'customer', 'batch', 'probe'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => { setDimension(d); setSelectedIds([]); }}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    dimension === d
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {d === 'vehicle' ? '车辆' : d === 'route' ? '路线' : d === 'customer' ? '客户' : d === 'batch' ? '批次' : '温控箱'}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {options.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedIds.includes(opt.id)
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(opt.id)}
                    onChange={() => toggleSelect(opt.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">{opt.name}</span>
                </label>
              ))}
            </div>

            {selectedIds.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-2">
                  已选择 {selectedIds.length} 个对象进行对比
                </p>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  清除选择
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedIds.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">请选择对比对象</h3>
              <p className="text-sm text-gray-400">在左侧选择至少2个对象进行多维度对比</p>
            </div>
          ) : loading ? (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : compareData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">对比分析结果</h3>
                <button
                  onClick={() => {
                    const csv = [
                      ['对象名称', '平均温度(°C)', '异常次数', '准时到货率(%)', '平均配送时长(分钟)'],
                      ...compareData.items.map(item => [
                        item.name,
                        item.avgTemperature.toFixed(2),
                        item.anomalyCount,
                        item.onTimeRate,
                        item.avgDuration,
                      ])
                    ].map(row => row.join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `对比分析_${dimension}_${new Date().toISOString().split('T')[0]}.csv`;
                    link.click();
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  导出CSV
                </button>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  平均温度对比
                </h3>
                <div className="space-y-4">
                  {compareData.items.map((item) => (
                    <div key={item.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="font-medium text-gray-800">{item.avgTemperature.toFixed(2)}°C</span>
                      </div>
                      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg transition-all duration-500"
                          style={{ width: getBarWidth(item.avgTemperature, 'avgTemperature') }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    异常次数
                  </h3>
                  <div className="space-y-4">
                    {compareData.items.map((item) => (
                      <div key={item.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="font-medium text-gray-800">{item.anomalyCount} 次</span>
                        </div>
                        <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-lg"
                            style={{ width: getBarWidth(item.anomalyCount, 'anomalyCount') }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    准时到货率
                  </h3>
                  <div className="space-y-4">
                    {compareData.items.map((item) => (
                      <div key={item.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="font-medium text-gray-800">{item.onTimeRate}%</span>
                        </div>
                        <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-lg"
                            style={{ width: `${item.onTimeRate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  平均配送时长（分钟）
                </h3>
                <div className="space-y-4">
                  {compareData.items.map((item) => (
                    <div key={item.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="font-medium text-gray-800">{item.avgDuration} 分钟</span>
                      </div>
                      <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg"
                          style={{ width: getBarWidth(item.avgDuration, 'avgDuration') }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
