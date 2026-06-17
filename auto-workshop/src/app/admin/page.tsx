'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WorkOrder {
  id: string;
  orderNo: string;
  status: string;
  totalAmount: number | null;
  createdAt: string;
  vehicle: { plateNo: string; brand: string; model: string };
  customer: { name: string };
  technician: { name: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  CREATED: '已创建',
  INSPECTING: '检测中',
  QUOTED: '已报价',
  APPROVED: '客户已确认',
  IN_PROGRESS: '维修中',
  PARTS_WAITING: '等待配件',
  TEST_DRIVE: '试驾中',
  COMPLETED: '已完成',
  ABNORMAL_CLOSED: '异常关闭',
  CASHIERED: '已收银',
};

export default function AdminDashboard() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completedToday: 0,
    abnormalClosed: 0,
  });

  useEffect(() => {
    fetch('/api/workorders?pageSize=100')
      .then((res) => res.json())
      .then((data) => {
        const orders = data.data || [];
        setWorkOrders(orders);
        const today = new Date().toISOString().slice(0, 10);
        setStats({
          total: data.pagination?.total || orders.length,
          inProgress: orders.filter((o: WorkOrder) => o.status === 'IN_PROGRESS').length,
          completedToday: orders.filter((o: WorkOrder) => o.status === 'COMPLETED' && o.createdAt.slice(0, 10) === today).length,
          abnormalClosed: orders.filter((o: WorkOrder) => o.status === 'ABNORMAL_CLOSED').length,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">总工单数</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">进行中</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.inProgress}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">今日完成</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.completedToday}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">异常关闭</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{stats.abnormalClosed}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/admin/workorders/new" className="btn-primary">
          新建工单
        </Link>
        <Link href="/admin/workorders" className="btn-secondary">
          查看全部工单
        </Link>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">最近工单</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : workOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无工单</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">工单号</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">车牌号</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">客户</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">状态</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">技师</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <Link href={`/admin/workorders/${order.id}`} className="text-blue-600 hover:text-blue-800">
                        {order.orderNo}
                      </Link>
                    </td>
                    <td className="py-3 px-2">{order.vehicle?.plateNo || '-'}</td>
                    <td className="py-3 px-2">{order.customer?.name || '-'}</td>
                    <td className="py-3 px-2">
                      <span className={`badge-${order.status.toLowerCase()}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">{order.technician?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
