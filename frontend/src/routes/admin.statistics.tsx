import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api, exportFile } from '@/utils/api';
import {
  BarChart3,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  Coins,
  Users,
  ShoppingBag,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { formatNumber } from '@/utils';

export const Route = createFileRoute('/admin/statistics')({
  component: AdminStatisticsPage,
});

function AdminStatisticsPage() {
  const [dimension, setDimension] = useState<'date' | 'product' | 'level'>('date');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [costData, setCostData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, [dimension, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [costResult, trendResult] = await Promise.all([
        api.get('/admin/statistics/point-cost', {
          startDate,
          endDate,
          dimension,
        }),
        api.get('/admin/statistics/exchange-trend', {
          startDate,
          endDate,
          period: 'day',
        }),
      ]);

      setCostData(costResult);
      setFilters((costResult as any).filters || {});

      const dates = (trendResult as any).dates || [];
      const orders = (trendResult as any).orders || [];
      const points = (trendResult as any).points || [];

      setTrendData(
        dates.map((date: string, i: number) => ({
          date: date.slice(5),
          orders: orders[i] || 0,
          points: points[i] || 0,
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportFile('/admin/statistics/export', {
        type: 'point-cost',
        startDate,
        endDate,
        dimension,
        ...filters,
      }, '积分成本统计.csv');
    } catch (e: any) {
      alert(e.message || '导出失败');
    }
  };

  const COLORS = ['#5EC4B3', '#F5A962', '#FF859E', '#A78BFA', '#34D399', '#FBBF24'];

  const summary = costData?.summary || {
    totalOrders: 0,
    totalPoints: 0,
    totalMembers: 0,
    avgPointsPerOrder: 0,
  };

  const statCards = [
    { label: '总兑换订单', value: summary.totalOrders, icon: ShoppingBag, color: 'from-brand-500 to-brand-600' },
    { label: '总积分消耗', value: formatNumber(summary.totalPoints), icon: Coins, color: 'from-accent-500 to-accent-600' },
    { label: '兑换会员数', value: summary.totalMembers, icon: Users, color: 'from-pink-500 to-pink-600' },
    { label: '笔均积分', value: formatNumber(summary.avgPointsPerOrder), icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
  ];

  return (
    <div className="p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">积分成本统计</h1>
          <p className="text-gray-500 mt-1">按维度查看积分消耗情况</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:border-brand-300 hover:text-brand-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          导出报表
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <span className="text-gray-400">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">统计维度：</span>
            {[
              { value: 'date', label: '按日期' },
              { value: 'product', label: '按商品' },
              { value: 'level', label: '按等级' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setDimension(item.value as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dimension === item.value
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl p-5 shadow-soft animate-fadeInUp"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            {dimension === 'date' ? '每日积分消耗趋势' : dimension === 'product' ? '各商品积分消耗' : '各等级积分消耗'}
          </h3>
          <div className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : dimension === 'date' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="totalPoints" fill="#5EC4B3" radius={[4, 4, 0, 0]} name="积分消耗" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(costData?.data || []).slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis dataKey="label" type="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="totalPoints" fill="#5EC4B3" radius={[0, 4, 4, 0]} name="积分消耗" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h3 className="font-semibold text-gray-800 mb-4">兑换趋势</h3>
          <div className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="orders" stroke="#F5A962" strokeWidth={2} dot={false} name="订单数" />
                  <Line type="monotone" dataKey="points" stroke="#5EC4B3" strokeWidth={2} dot={false} name="积分" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {costData?.data && costData.data.length > 0 && (
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden mt-6">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">详细数据</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">
                    {dimension === 'date' ? '日期' : dimension === 'product' ? '商品名称' : '会员等级'}
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">订单数</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">积分消耗</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">会员数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {costData.data.slice(0, 20).map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-gray-800">{item.label}</td>
                    <td className="px-6 py-3 text-sm text-right text-gray-600">{item.orderCount}</td>
                    <td className="px-6 py-3 text-sm text-right text-brand-600 font-medium">
                      {formatNumber(item.totalPoints)}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-gray-600">{item.memberCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
