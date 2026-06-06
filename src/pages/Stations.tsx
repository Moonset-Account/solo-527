import { useEffect, useState } from 'react';
import { Filter, Save, X, ChevronDown } from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import type { Station, StationTrend } from '@shared/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function Stations() {
  const { stations, setStations, selectedStation, setSelectedStation, setLoading, setError } = useDashboardStore();
  const [showFilters, setShowFilters] = useState(false);
  const [filterArea, setFilterArea] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stationTrend, setStationTrend] = useState<StationTrend[]>([]);
  const [saveFilterName, setSaveFilterName] = useState('');

  const areas = Array.from(new Set(stations.map(s => s.area)));

  useEffect(() => {
    if (stations.length === 0) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          if (filterArea) params.append('area', filterArea);
          if (filterStatus) params.append('status', filterStatus);
          const res = await fetch(`/api/stations?${params}`);
          const result = await res.json();
          if (result.code === 0) {
            setStations(result.data);
          }
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [stations.length, filterArea, filterStatus, setStations, setLoading, setError]);

  useEffect(() => {
    if (selectedStation) {
      const fetchDetail = async () => {
        try {
          const res = await fetch(`/api/stations/${selectedStation.id}`);
          const result = await res.json();
          if (result.code === 0) {
            setStationTrend(result.data.trend);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchDetail();
    }
  }, [selectedStation]);

  const statusConfig = {
    normal: { label: '正常', class: 'badge-success' },
    low: { label: '不足', class: 'badge-danger' },
    full: { label: '堆积', class: 'badge-info' },
    maintenance: { label: '维护', class: 'badge-warning' },
  };

  const filteredStations = stations.filter(s => {
    if (filterArea && s.area !== filterArea) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">站点分析</h2>
          <p className="text-sm text-gray-400 mt-1">共 {filteredStations.length} 个站点</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            筛选
            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="glass-card p-4 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">区域</label>
              <select
                className="input-field w-full"
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
              >
                <option value="">全部区域</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">状态</label>
              <select
                className="input-field w-full"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">全部状态</option>
                {Object.entries(statusConfig).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">保存筛选</label>
              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="筛选组合名称"
                  value={saveFilterName}
                  onChange={(e) => setSaveFilterName(e.target.value)}
                />
                <button className="btn-primary flex items-center gap-1">
                  <Save size={14} />
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 glass-card p-5">
          <h3 className="section-title mb-4">站点列表</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-3 data-table-header">站点名称</th>
                  <th className="text-left py-3 data-table-header">区域</th>
                  <th className="text-right py-3 data-table-header">容量</th>
                  <th className="text-right py-3 data-table-header">可用</th>
                  <th className="text-right py-3 data-table-header">维修</th>
                  <th className="text-center py-3 data-table-header">状态</th>
                </tr>
              </thead>
              <tbody>
                {filteredStations.map((station) => (
                  <tr
                    key={station.id}
                    className={`border-b border-dark-border/50 hover:bg-white/5 cursor-pointer transition-colors ${
                      selectedStation?.id === station.id ? 'bg-accent-cyan/10' : ''
                    }`}
                    onClick={() => setSelectedStation(station)}
                  >
                    <td className="py-3 text-sm text-gray-200">{station.name}</td>
                    <td className="py-3 text-sm text-gray-400">{station.area}</td>
                    <td className="py-3 text-sm text-gray-300 text-right font-mono">{station.capacity}</td>
                    <td className="py-3 text-sm text-emerald-400 text-right font-mono font-medium">{station.availableBikes}</td>
                    <td className="py-3 text-sm text-amber-400 text-right font-mono">{station.maintenanceBikes}</td>
                    <td className="py-3 text-center">
                      <span className={`badge ${statusConfig[station.status].class}`}>
                        {statusConfig[station.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-5 space-y-6">
          {selectedStation ? (
            <>
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-title">站点详情</h3>
                  <button onClick={() => setSelectedStation(null)} className="text-gray-500 hover:text-gray-300">
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">站点名称</span>
                    <span className="text-white font-medium">{selectedStation.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">所属区域</span>
                    <span className="text-gray-200">{selectedStation.area}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">站点容量</span>
                    <span className="text-gray-200 font-mono">{selectedStation.capacity} 个桩</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">可用车辆</span>
                    <span className="text-emerald-400 font-mono font-medium">{selectedStation.availableBikes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">维修中车辆</span>
                    <span className="text-amber-400 font-mono">{selectedStation.maintenanceBikes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">可用空位</span>
                    <span className="text-blue-400 font-mono">{selectedStation.availableDocks}</span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-accent-cyan h-2 rounded-full transition-all"
                      style={{ width: `${(selectedStation.availableBikes / selectedStation.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="glass-card p-5">
                <h3 className="section-title mb-4">24小时余量趋势</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stationTrend}>
                      <defs>
                        <linearGradient id="colorBikes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00B4D8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(v) => `${new Date(v).getHours()}时`}
                        stroke="#6b7280"
                        fontSize={11}
                      />
                      <YAxis stroke="#6b7280" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          border: '1px solid #1f2937',
                          borderRadius: '8px',
                        }}
                        labelFormatter={(v) => new Date(v).toLocaleString('zh-CN', { hour: 'numeric', minute: 'numeric' })}
                      />
                      <Area
                        type="monotone"
                        dataKey="availableBikes"
                        stroke="#00B4D8"
                        fill="url(#colorBikes)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card p-10 text-center">
              <p className="text-gray-500">点击左侧表格中的站点查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
