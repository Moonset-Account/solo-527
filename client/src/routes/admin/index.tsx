import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { analyticsApi, orderApi } from '../../api';
import dayjs from 'dayjs';

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
});

interface OverviewData {
  orders: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    onTimeRate: number;
  };
  workload: {
    avgLoadRate: number;
    overloadedTechDays: number;
  };
  topDelayReasons: Array<{ reason: string; count: number }>;
}

function AdminDashboard() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await analyticsApi.overview();
        setOverview(data as any);
      } catch (error) {
        console.error('Failed to fetch overview:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>;
  }

  const stats = [
    { label: '总订单数', value: overview?.orders.total || 0, color: 'bg-blue-500' },
    { label: '待处理', value: overview?.orders.pending || 0, color: 'bg-yellow-500' },
    { label: '已完成', value: overview?.orders.completed || 0, color: 'bg-green-500' },
    { label: '准时履约率', value: `${(overview?.orders.onTimeRate || 0).toFixed(1)}%`, color: 'bg-purple-500' },
  ];

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待分配', color: 'bg-yellow-100 text-yellow-800' },
    assigned: { label: '已派单', color: 'bg-blue-100 text-blue-800' },
    in_progress: { label: '维修中', color: 'bg-purple-100 text-purple-800' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
    cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800' },
    refunded: { label: '已退款', color: 'bg-red-100 text-red-800' },
  };

  const delayReasonMap: Record<string, string> = {
    technician_shortage: '师傅人手不足',
    parts_unavailable: '配件缺货',
    customer_reschedule: '客户改约',
    weather: '天气原因',
    traffic: '交通拥堵',
    complex_repair: '维修难度大',
    other: '其他原因',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">数据概览</h1>
        <p className="text-gray-500 mt-1">家电维修售后中心运营数据总览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                {index === 0 ? '📦' : index === 1 ? '⏳' : index === 2 ? '✅' : '⏱️'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">师傅负载情况</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">平均负载率</span>
              <span className="font-semibold text-gray-800">
                {(overview?.workload.avgLoadRate || 0).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  (overview?.workload.avgLoadRate || 0) > 90 ? 'bg-red-500' :
                  (overview?.workload.avgLoadRate || 0) > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(overview?.workload.avgLoadRate || 0, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">超负荷天数</span>
              <span className="text-red-600 font-medium">
                {overview?.workload.overloadedTechDays || 0} 天/人
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">延迟原因 TOP5</h3>
          <div className="space-y-3">
            {overview?.topDelayReasons?.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <span className="flex-1 text-gray-700">
                  {delayReasonMap[item.reason] || item.reason}
                </span>
                <span className="text-gray-500 font-medium">{item.count} 单</span>
              </div>
            ))}
            {(!overview?.topDelayReasons || overview.topDelayReasons.length === 0) && (
              <p className="text-gray-400 text-center py-4">暂无延迟数据</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '新建订单', icon: '➕', path: '/book' },
            { label: '退款审批', icon: '💰', path: '/admin/refunds' },
            { label: '差评处理', icon: '⭐', path: '/admin/reviews' },
            { label: '履约分析', icon: '📈', path: '/admin/analytics' },
          ].map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm text-gray-700 font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Link } from '@tanstack/react-router';
