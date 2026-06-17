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

interface Technician {
  id: string;
  name: string;
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

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'CREATED', label: '已创建' },
  { value: 'INSPECTING', label: '检测中' },
  { value: 'QUOTED', label: '已报价' },
  { value: 'APPROVED', label: '客户已确认' },
  { value: 'IN_PROGRESS', label: '维修中' },
  { value: 'PARTS_WAITING', label: '等待配件' },
  { value: 'TEST_DRIVE', label: '试驾中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'ABNORMAL_CLOSED', label: '异常关闭' },
  { value: 'CASHIERED', label: '已收银' },
];

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetch('/api/technicians')
      .then((res) => res.json())
      .then((data) => setTechnicians(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: '10',
    });
    if (statusFilter) params.set('status', statusFilter);
    if (technicianFilter) params.set('technicianId', technicianFilter);

    fetch(`/api/workorders?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setWorkOrders(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [statusFilter, technicianFilter, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">工单管理</h1>
        <Link href="/admin/workorders/new" className="btn-primary">
          新建工单
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            className="input-field w-auto"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            className="input-field w-auto"
            value={technicianFilter}
            onChange={(e) => { setTechnicianFilter(e.target.value); setPage(1); }}
          >
            <option value="">全部技师</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : workOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无工单</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-600">工单号</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">车牌号</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">客户</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">状态</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">技师</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">金额</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => window.location.href = `/admin/workorders/${order.id}`}
                    >
                      <td className="py-3 px-2 text-blue-600">{order.orderNo}</td>
                      <td className="py-3 px-2">{order.vehicle?.plateNo || '-'}</td>
                      <td className="py-3 px-2">{order.customer?.name || '-'}</td>
                      <td className="py-3 px-2">
                        <span className={`badge-${order.status.toLowerCase()}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">{order.technician?.name || '-'}</td>
                      <td className="py-3 px-2">{order.totalAmount != null ? `¥${Number(order.totalAmount).toFixed(2)}` : '-'}</td>
                      <td className="py-3 px-2">{new Date(order.createdAt).toLocaleString('zh-CN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <button
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </button>
              <span className="text-sm text-gray-600">第 {page} / {totalPages} 页</span>
              <button
                className="btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
