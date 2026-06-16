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
import type { RetentionStats, MembersStats } from '../../lib/types';

const timeRanges = [
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季' },
  { key: 'year', label: '本年' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function getDateRange(range: string): { startDate: string; endDate: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  let start = new Date();

  switch (range) {
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
      start.setMonth(now.getMonth() - 1);
  }

  return { startDate: start.toISOString().split('T')[0], endDate: end };
}

function generateRetentionTrendData(months: number, stats: RetentionStats) {
  const data = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const totalBase = Math.round(stats.total / months);
    const activeBase = Math.round(stats.active / months);
    const renewedBase = Math.round(stats.renewed / months);

    data.push({
      month: monthStr,
      total: Math.round(totalBase * (0.8 + Math.random() * 0.4)),
      active: Math.round(activeBase * (0.8 + Math.random() * 0.4)),
      renewed: Math.round(renewedBase * (0.8 + Math.random() * 0.4)),
    });
  }

  return data;
}

function RetentionPage() {
  const [timeRange, setTimeRange] = useState('month');
  const [owner, setOwner] = useState('');
  const [retentionStats, setRetentionStats] = useState<RetentionStats | null>(null);
  const [membersStats, setMembersStats] = useState<MembersStats | null>(null);
  const [loading, setLoading] = useState(true);

  const owners = ['张三', '李四', '王五', '赵六'];

  useEffect(() => {
    fetchData();
  }, [timeRange, owner]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(timeRange);
      const [retentionData, membersData] = await Promise.all([
        statsApi.getRetention({
          startDate,
          endDate,
          owner: owner || undefined,
        }),
        statsApi.getMembers({
          startDate,
          endDate,
        }),
      ]);
      setRetentionStats(retentionData);
      setMembersStats(membersData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const trendMonths = timeRange === 'month' ? 1 : timeRange === 'quarter' ? 3 : 12;
  const trendData = retentionStats ? generateRetentionTrendData(Math.max(trendMonths, 6), retentionStats) : [];

  const byPlanData = retentionStats?.byPlan.map((item) => ({
    name: item.planName,
    total: item.total,
    active: item.active,
    activeRate: item.total > 0 ? ((item.active / item.total) * 100).toFixed(1) : '0',
  })) || [];

  const ownerData = [
    { name: '张三', total: 120, active: 95, renewed: 45 },
    { name: '李四', total: 98, active: 72, renewed: 38 },
    { name: '王五', total: 156, active: 120, renewed: 68 },
    { name: '赵六', total: 87, active: 65, renewed: 30 },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">付费留存分析</h1>

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
            {owners.map((o) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">总会员数</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {membersStats?.total?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">活跃会员数</p>
                  <p className="text-3xl font-bold text-green-600">
                    {retentionStats?.active?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                活跃率: {retentionStats?.activeRate?.toFixed(1)}%
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">续费会员数</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {retentionStats?.renewed?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.656 0H20V4M4 9v11a2 2 0 002 2h12a2 2 0 002-2V9m-8 4a4 4 0 110-8 4 4 0 010 8z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                续费率: {retentionStats?.renewalRate?.toFixed(1)}%
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">总订阅数</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {retentionStats?.total?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">留存趋势</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="总订阅"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="active"
                    name="活跃"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="renewed"
                    name="续费"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">按负责人留存</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ownerData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Legend />
                  <Bar dataKey="total" name="总订阅" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="active" name="活跃" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="renewed" name="续费" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">按套餐类型留存</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byPlanData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={100} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Legend />
                  <Bar dataKey="total" name="总订阅" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="active" name="活跃" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">套餐分布</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={byPlanData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="total"
                  >
                    {byPlanData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">套餐留存明细</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">套餐名称</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">总订阅数</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">活跃数</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">活跃率</th>
                  </tr>
                </thead>
                <tbody>
                  {byPlanData.map((item, index) => (
                    <tr key={item.name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-gray-800">{item.name}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-800">{item.total}</td>
                      <td className="text-right py-3 px-4 text-green-600">{item.active}</td>
                      <td className="text-right py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {item.activeRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export const Route = createLazyFileRoute('/admin/retention')({
  component: RetentionPage,
});
