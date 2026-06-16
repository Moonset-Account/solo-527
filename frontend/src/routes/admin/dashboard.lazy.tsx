import { createLazyFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { statsApi } from '../../lib/api';
import type { RevenueCostStats } from '../../lib/types';

const timeRanges = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季' },
  { key: 'year', label: '本年' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function getDateRange(range: string): { startDate: string; endDate: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  let start = new Date();

  switch (range) {
    case 'today':
      start = new Date();
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setDate(now.getDate() - 30);
  }

  return { startDate: start.toISOString().split('T')[0], endDate: end };
}

function DashboardPage() {
  const [timeRange, setTimeRange] = useState('month');
  const [owner, setOwner] = useState('');
  const [stats, setStats] = useState<RevenueCostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownersList, setOwnersList] = useState<string[]>([]);

  useEffect(() => {
    fetchStats();
    fetchOwners();
  }, [timeRange, owner]);

  const fetchOwners = async () => {
    try {
      const data = await statsApi.getOwners();
      setOwnersList(data.owners);
    } catch (error) {
      console.error('Failed to fetch owners:', error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(timeRange);
      const data = await statsApi.getRevenueCost({
        startDate,
        endDate,
        owner: owner || undefined,
      });
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const trendData = stats?.byDate?.map((item) => ({
    date: item.date.slice(5),
    revenue: Number(item.revenue),
    cost: Number(item.cost),
  })) || [];

  const ownerStatsData = stats?.byOwner?.map((item) => ({
    name: item.owner,
    revenue: Number(item.revenue),
    cost: Number(item.cost),
    profit: item.profit,
  })) || [];

  const revenueByTypeData = stats?.revenue.byType.map((item) => ({
    name: item.type,
    value: Number(item.amount),
  })) || [];

  const costByTypeData = stats?.cost.byType.map((item) => ({
    name: item.type,
    value: Number(item.amount),
  })) || [];

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? Number(value) : value;
    return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">收入成本统计看板</h1>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            {timeRanges.map((range) => (
              <button
                key={range.key}
                onClick={() => setTimeRange(range.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部负责人</option>
            {ownersList.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">总收入</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(stats?.revenue.total || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">共 {stats?.revenue.count || 0} 笔收入</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">总成本</p>
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(stats?.cost.total || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">共 {stats?.cost.count || 0} 笔支出</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">净利润</p>
                  <p className={`text-3xl font-bold ${(stats?.profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(stats?.profit || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                利润率: {stats && Number(stats.revenue.total) > 0
                  ? `${((stats.profit / Number(stats.revenue.total)) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">收入成本趋势</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="收入"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    name="成本"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">收入类型分布</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={revenueByTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {revenueByTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">成本类型分布</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={costByTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {costByTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {ownerStatsData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">按负责人统计</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ownerStatsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="收入" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" name="成本" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="利润" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">收入类型明细</h2>
              <div className="space-y-3">
                {stats?.revenue.byType.map((item, index) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-700">{item.type}</span>
                    </div>
                    <span className="font-medium text-green-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">成本类型明细</h2>
              <div className="space-y-3">
                {stats?.cost.byType.map((item, index) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-700">{item.type}</span>
                    </div>
                    <span className="font-medium text-red-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export const Route = createLazyFileRoute('/admin/dashboard')({
  component: DashboardPage,
});
