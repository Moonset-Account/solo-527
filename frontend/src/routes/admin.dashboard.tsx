import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import {
  Package,
  ShoppingCart,
  Users,
  Coins,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const Route = createFileRoute('/admin/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalMembers: 0,
    totalPoints: 0,
  });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [productsData, ordersData, membersData, trendDataResult] = await Promise.all([
        api.get('/admin/products', { pageSize: 1, status: 'active' }),
        api.get('/admin/orders', { pageSize: 1 }),
        api.get('/admin/members', { pageSize: 1 }),
        api.get('/admin/statistics/exchange-trend', { startDate, endDate, period: 'day' }),
      ]);

      setStats({
        totalProducts: productsData.total || 0,
        totalOrders: ordersData.total || 0,
        totalMembers: membersData.total || 0,
        totalPoints: (trendDataResult as any).points?.reduce((a: number, b: number) => a + b, 0) || 0,
      });

      const dates = (trendDataResult as any).dates || [];
      const orders = (trendDataResult as any).orders || [];
      const points = (trendDataResult as any).points || [];

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

  const statCards = [
    {
      label: '商品总数',
      value: stats.totalProducts,
      icon: Package,
      color: 'from-brand-500 to-brand-600',
      change: '+12%',
      trend: 'up',
    },
    {
      label: '兑换订单',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'from-accent-500 to-accent-600',
      change: '+23%',
      trend: 'up',
    },
    {
      label: '会员总数',
      value: stats.totalMembers,
      icon: Users,
      color: 'from-pink-500 to-pink-600',
      change: '+8%',
      trend: 'up',
    },
    {
      label: '积分消耗',
      value: stats.totalPoints.toLocaleString(),
      icon: Coins,
      color: 'from-purple-500 to-purple-600',
      change: '+15%',
      trend: 'up',
    },
  ];

  return (
    <div className="p-6 animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
        <p className="text-gray-500 mt-1">欢迎回来，查看今日运营数据</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl p-5 shadow-soft hover:shadow-md transition-shadow animate-fadeInUp"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  card.trend === 'up' ? 'text-green-600' : 'text-red-500'
                }`}>
                  {card.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {card.change}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-1">{card.value}</div>
              <div className="text-sm text-gray-500">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-soft">
          <h3 className="font-semibold text-gray-800 mb-4">兑换趋势</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  stroke="#5EC4B3"
                  strokeWidth={2}
                  dot={false}
                  name="订单数"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="points"
                  stroke="#F5A962"
                  strokeWidth={2}
                  dot={false}
                  name="积分"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-soft">
          <h3 className="font-semibold text-gray-800 mb-4">积分消耗排行</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: '日用品', value: 4500 },
                  { name: '洗护', value: 3800 },
                  { name: '玩具', value: 3200 },
                  { name: '服饰', value: 2800 },
                  { name: '喂养', value: 2100 },
                ]}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="#5EC4B3" radius={[0, 4, 4, 0]} name="积分消耗" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
