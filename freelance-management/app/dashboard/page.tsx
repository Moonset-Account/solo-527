'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { statsApi, projectApi, invoiceApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, projectsData] = await Promise.all([
          statsApi.getDashboard(),
          projectApi.list(),
        ]);
        setStats(statsData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    );
  }

  const isClient = user?.role === Role.CLIENT;

  const statCards = isClient
    ? [
        {
          label: '我的项目',
          value: stats.projects?.total || 0,
          icon: '📁',
          color: 'from-blue-500 to-blue-600',
        },
        {
          label: '进行中',
          value: stats.projects?.inProgress || 0,
          icon: '🔄',
          color: 'from-amber-500 to-orange-500',
        },
        {
          label: '待支付金额',
          value: `¥${(stats.revenue?.outstandingAmount || 0).toLocaleString()}`,
          icon: '💰',
          color: 'from-red-500 to-pink-500',
        },
        {
          label: '已完成项目',
          value: stats.projects?.completed || 0,
          icon: '✅',
          color: 'from-emerald-500 to-teal-500',
        },
      ]
    : [
        {
          label: '总收入',
          value: `¥${(stats.revenue?.totalRevenue || 0).toLocaleString()}`,
          icon: '💰',
          color: 'from-emerald-500 to-teal-500',
        },
        {
          label: '项目总数',
          value: stats.projects?.total || 0,
          icon: '📁',
          color: 'from-blue-500 to-blue-600',
        },
        {
          label: '待收金额',
          value: `¥${(stats.revenue?.outstandingAmount || 0).toLocaleString()}`,
          icon: '⏳',
          color: 'from-amber-500 to-orange-500',
        },
        {
          label: '总工时',
          value: `${stats.revenue?.totalHours || 0}h`,
          icon: '⏱️',
          color: 'from-purple-500 to-violet-500',
        },
      ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      pending_approval: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      delivered: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: '草稿',
      pending_approval: '待审核',
      in_progress: '进行中',
      delivered: '已交付',
      completed: '已完成',
      cancelled: '已取消',
    };
    return labels[status] || status;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            欢迎回来，{user?.name}
          </h1>
          <p className="text-gray-500 mt-1">这是您的业务概览</p>
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">最近项目</h2>
              <a
                href="/projects"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                查看全部
              </a>
            </div>
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => (window.location.href = `/projects/${project.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white font-semibold">
                      {project.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-500">
                        {project.client_name || '未分配客户'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">项目状态分布</h2>
            <div className="space-y-4">
              {[
                { label: '进行中', value: stats.projects?.inProgress || 0, color: 'bg-blue-500' },
                { label: '待审核', value: stats.projects?.pending || 0, color: 'bg-yellow-500' },
                { label: '已完成', value: stats.projects?.completed || 0, color: 'bg-green-500' },
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: `${(item.value / (stats.projects?.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {!isClient && stats.topClients && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Top 客户</h3>
                <div className="space-y-2">
                  {stats.topClients.slice(0, 3).map((client: any, index: number) => (
                    <div key={client.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700">{client.name}</span>
                      </div>
                      <span className="text-sm font-medium text-emerald-600">
                        ¥{client.total_revenue?.toLocaleString() || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
