'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { statsApi, exportApi } from '@/lib/api';

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await statsApi.getDashboard();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      label: '总收入',
      value: `¥${(stats.revenue?.totalRevenue || 0).toLocaleString()}`,
      icon: '💰',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      label: '已开票金额',
      value: `¥${(stats.revenue?.paidInvoicedAmount || 0).toLocaleString()}`,
      icon: '📄',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      label: '待收金额',
      value: `¥${(stats.revenue?.outstandingAmount || 0).toLocaleString()}`,
      icon: '⏳',
      color: 'from-amber-500 to-orange-500',
    },
    {
      label: '逾期金额',
      value: `¥${(stats.revenue?.overdueAmount || 0).toLocaleString()}`,
      icon: '⚠️',
      color: 'from-red-500 to-pink-500',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">收入统计</h1>
            <p className="text-gray-500 mt-1">查看业务数据和报表</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportApi.revenue()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              导出报表
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center text-2xl`}
                >
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">月度收入趋势</h2>
            <div className="space-y-4">
              {stats.monthly?.slice(0, 6).map((month: any, index: number) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{month.month}</span>
                    <span className="text-sm font-medium text-gray-900">
                      ¥{month.revenue?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.min((month.revenue / (stats.revenue?.totalRevenue || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 客户</h2>
            <div className="space-y-3">
              {stats.topClients?.map((client: any, index: number) => (
                <div key={client.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.project_count || 0} 个项目</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">
                      ¥{client.total_revenue?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500">项目总数</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.projects?.total || 0}</p>
            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-blue-600">进行中: {stats.projects?.inProgress || 0}</span>
              <span className="text-green-600">已完成: {stats.projects?.completed || 0}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500">发票总数</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.invoices?.totalCount || 0}</p>
            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-green-600">已支付: {stats.invoices?.paidCount || 0}</span>
              <span className="text-amber-600">待支付: {stats.invoices?.outstandingCount || 0}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500">总工时</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.revenue?.totalHours || 0}h</p>
            <p className="mt-2 text-xs text-emerald-600">
              可计费: {stats.revenue?.billableHours || 0}h
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500">客户数量</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.revenue?.clientCount || 0}</p>
            <p className="mt-2 text-xs text-gray-500">
              活跃客户: {stats.topClients?.length || 0}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
