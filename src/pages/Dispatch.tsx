import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Dispatch() {
  const [records, setRecords] = useState<any[]>([]);
  const [effectData, setEffectData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterStatus) params.append('status', filterStatus);
        const [recordsRes, effectRes] = await Promise.all([
          fetch(`/api/dispatch/records?${params}`),
          fetch('/api/dispatch/effect'),
        ]);
        const recordsData = await recordsRes.json();
        const effectDataRes = await effectRes.json();
        if (recordsData.code === 0) setRecords(recordsData.data.records);
        if (effectDataRes.code === 0) setEffectData(effectDataRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filterStatus]);

  const statusConfig = {
    pending: { label: '待执行', class: 'badge-warning' },
    processing: { label: '执行中', class: 'badge-info' },
    completed: { label: '已完成', class: 'badge-success' },
    failed: { label: '失败', class: 'badge-danger' },
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const chartData = effectData.slice(0, 10).map(d => ({
    name: d.dispatchId,
    调度前缺口: d.beforeGap,
    调度后缺口: d.afterGap,
    ROI: d.roi * 10,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">调度管理</h2>
          <p className="text-sm text-gray-400 mt-1">调度记录追踪与效果评估</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input-field"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">全部状态</option>
            {Object.entries(statusConfig).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '今日调度', value: records.filter(r => r.status === 'completed').length, unit: '次', color: 'text-emerald-400' },
          { label: '执行中', value: records.filter(r => r.status === 'processing').length, unit: '单', color: 'text-blue-400' },
          { label: '待执行', value: records.filter(r => r.status === 'pending').length, unit: '单', color: 'text-amber-400' },
          { label: '平均效果评分', value: Math.round(effectData.reduce((s, d) => s + d.effectScore, 0) / (effectData.length || 1)), unit: '分', color: 'text-accent-cyan' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4">
            <p className="text-sm text-gray-400">{stat.label}</p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className={`stat-number !text-xl ${stat.color} !from-current !to-current`}>{stat.value}</span>
              <span className="text-xs text-gray-500">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 glass-card p-5">
          <h3 className="section-title mb-4">调度记录</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-3 data-table-header">调度ID</th>
                  <th className="text-left py-3 data-table-header">起点→终点</th>
                  <th className="text-center py-3 data-table-header">车辆数</th>
                  <th className="text-left py-3 data-table-header">操作员</th>
                  <th className="text-left py-3 data-table-header">执行时间</th>
                  <th className="text-center py-3 data-table-header">状态</th>
                  <th className="text-right py-3 data-table-header">效果分</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 15).map((record) => (
                  <tr key={record.id} className="border-b border-dark-border/50 hover:bg-white/5">
                    <td className="py-3 text-sm font-mono text-accent-cyan">{record.id}</td>
                    <td className="py-3 text-sm text-gray-200">
                      <span className="text-gray-400">{record.fromStationName}</span>
                      <span className="mx-2 text-gray-600">→</span>
                      <span className="text-gray-200">{record.toStationName}</span>
                    </td>
                    <td className="py-3 text-sm text-gray-300 text-center font-mono">{record.bikeCount}</td>
                    <td className="py-3 text-sm text-gray-400">{record.operator}</td>
                    <td className="py-3 text-sm text-gray-400 font-mono text-xs">{formatTime(record.executeTime)}</td>
                    <td className="py-3 text-center">
                      <span className={`badge ${statusConfig[record.status as keyof typeof statusConfig]?.class || 'badge-info'}`}>
                        {statusConfig[record.status as keyof typeof statusConfig]?.label || record.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {record.effectScore !== undefined ? (
                        <span className={`font-mono font-medium ${record.effectScore >= 70 ? 'text-emerald-400' : record.effectScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {Math.round(record.effectScore)}
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-4 glass-card p-5">
          <h3 className="section-title mb-4">调度效果对比</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis type="number" stroke="#6b7280" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={10} width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #1f2937',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="调度前缺口" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                <Bar dataKey="调度后缺口" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="section-title mb-4">ROI 排行榜</h3>
        <div className="grid grid-cols-5 gap-4">
          {effectData
            .sort((a, b) => b.roi - a.roi)
            .slice(0, 5)
            .map((d, i) => (
              <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-accent-cyan/10 to-blue-500/5 border border-accent-cyan/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">排名 #{i + 1}</span>
                  <span className="text-xs font-mono text-accent-cyan">{d.dispatchId}</span>
                </div>
                <div className="stat-number !text-2xl">{d.roi.toFixed(2)}x</div>
                <div className="text-xs text-gray-500 mt-1">
                  调度 {d.bikeCount} 辆车 | 效果分 {Math.round(d.effectScore)}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
