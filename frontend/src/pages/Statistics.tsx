import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuthStore } from '../store/auth';
import {
  formatMoney, formatDate, UserRole,
} from '../utils/constants';

export default function Statistics() {
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState({ startDate: '', endDate: '', photographerId: '' });
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>({});
  const [trend, setTrend] = useState<any[]>([]);
  const [satisfaction, setSatisfaction] = useState<any>({});
  const [satisfactionLevel, setSatisfactionLevel] = useState('');

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      api.get('/users/photographers').then((res: any) => setPhotographers(res));
    }
  }, []);

  useEffect(() => { loadData(); }, [filter, satisfactionLevel]);

  const loadData = async () => {
    try {
      const params: any = { ...filter };
      if (user?.role === UserRole.PHOTOGRAPHER) {
        params.photographerId = user.id;
      }
      const [dash, trendRes, sat]: any = await Promise.all([
        api.get('/statistics/dashboard', { params }),
        api.get('/statistics/trend', { params: { ...params, granularity: 'day' } }),
        api.get('/statistics/satisfaction', { params: { ...params, satisfactionLevel } }),
      ]);
      setDashboard(dash);
      setTrend(trendRes || []);
      setSatisfaction(sat);
    } catch {}
  };

  const handleExport = async (type: string) => {
    const params: any = { type, ...filter };
    if (user?.role === UserRole.PHOTOGRAPHER) {
      params.photographerId = user.id;
    }
    const res: any = await api.get('/statistics/export', { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res]));
    const link = document.createElement('a');
    link.href = url;
    const typeNames: Record<string, string> = { orders: '订单', settlements: '结算', materials: '素材', satisfaction: '满意度' };
    link.download = `${typeNames[type] || type}报表_${formatDate(new Date(), 'YYYYMMDD')}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const maxRevenue = Math.max(...trend.map((t: any) => t.revenue || 0), 1);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-center">
        <input type="date" value={filter.startDate} onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
          className="px-3 py-2 border rounded-lg text-sm outline-none" />
        <span className="text-slate-400">至</span>
        <input type="date" value={filter.endDate} onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
          className="px-3 py-2 border rounded-lg text-sm outline-none" />
        {user?.role === UserRole.ADMIN && (
          <select value={filter.photographerId} onChange={(e) => setFilter({ ...filter, photographerId: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm outline-none">
            <option value="">全部摄影师</option>
            {photographers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <button onClick={() => setFilter({ startDate: '', endDate: '', photographerId: '' })}
          className="px-3 py-2 text-sm text-slate-500 hover:text-primary-600">重置</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="总订单数" value={dashboard.totalOrders || 0} icon="📦" color="text-blue-600" />
        <StatCard label="已完成订单" value={dashboard.completedOrders || 0} icon="✅" color="text-emerald-600" />
        <StatCard label="总营收" value={`¥${formatMoney(dashboard.totalRevenue)}`} icon="💰" color="text-amber-600" />
        <StatCard label="摄影师收入" value={`¥${formatMoney(dashboard.photographerIncome)}`} icon="📸" color="text-purple-600" />
        <StatCard label="平台收入" value={`¥${formatMoney(dashboard.platformIncome)}`} icon="🏢" color="text-slate-600" />
        <StatCard label="待结算" value={`¥${formatMoney(dashboard.pendingSettlement)}`} icon="⏳" color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">满意度统计</h3>
            <select value={satisfactionLevel} onChange={(e) => setSatisfactionLevel(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm outline-none">
              <option value="">全部星级</option>
              <option value="5">⭐⭐⭐⭐⭐ 5星</option>
              <option value="4">⭐⭐⭐⭐ 4星</option>
              <option value="3">⭐⭐⭐ 3星</option>
              <option value="2">⭐⭐ 2星</option>
              <option value="1">⭐ 1星</option>
            </select>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">评价总数</span>
              <span className="font-semibold">{satisfaction.totalCount || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">平均评分</span>
              <span className="font-semibold text-amber-600">
                {satisfaction.averageRating ? `${Number(satisfaction.averageRating).toFixed(1)} 分` : '-'}
              </span>
            </div>
            {satisfaction.distribution && Object.entries(satisfaction.distribution)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([star, count]: any) => {
                const total = satisfaction.totalCount || 0;
                const percent = total ? (count / total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 w-12 shrink-0">{star}星</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${percent}%` }} />
                    </div>
                    <span className="text-slate-600 w-16 text-right shrink-0">
                      {count} 条 ({percent.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-slate-700 mb-4">营收趋势</h3>
          {trend.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">暂无数据</div>
          ) : (
            <div className="flex items-end gap-1 h-48">
              {trend.map((t: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <div className="relative w-full">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                      ¥{formatMoney(t.revenue)}
                    </div>
                  </div>
                  <div className="w-full bg-primary-500 hover:bg-primary-600 rounded-t transition-all min-w-0"
                    style={{ height: `${(t.revenue / maxRevenue) * 100}%`, minHeight: t.revenue > 0 ? '4px' : '0' }} />
                  <div className="text-xs text-slate-400 mt-1 truncate w-full text-center">
                    {t.date ? formatDate(t.date, 'MM/DD') : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-0">
          <h3 className="font-semibold text-slate-700">数据导出</h3>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <button onClick={() => handleExport('orders')}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 flex items-center gap-2">
            📦 导出订单报表
          </button>
          <button onClick={() => handleExport('settlements')}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 flex items-center gap-2">
            💰 导出结算报表
          </button>
          <button onClick={() => handleExport('materials')}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 flex items-center gap-2">
            🎨 导出素材报表
          </button>
          <button onClick={() => handleExport('satisfaction')}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 flex items-center gap-2">
            ⭐ 导出满意度报表
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500 mb-1">{label}</div>
          <div className={`text-xl font-bold ${color}`}>{value}</div>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
