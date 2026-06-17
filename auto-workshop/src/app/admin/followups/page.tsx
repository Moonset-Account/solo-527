'use client';

import { useState, useEffect } from 'react';

interface WorkOrder {
  id: string;
  orderNo: string;
  vehicle: { plateNo: string };
  customer: { name: string };
}

interface FollowUp {
  id: string;
  workOrderId: string;
  followUpAt: string;
  contactResult: string | null;
  satisfaction: number | null;
  issue: string | null;
  resolved: boolean;
  remark: string | null;
  createdAt: string;
  workOrder?: WorkOrder;
}

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    workOrderId: '',
    followUpAt: '',
    contactResult: '',
    satisfaction: '5',
    issue: '',
    remark: '',
  });

  const fetchFollowUps = () => {
    setLoading(true);
    fetch('/api/followups')
      .then((res) => res.json())
      .then((data) => {
        setFollowUps(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchFollowUps();
    fetch('/api/workorders?pageSize=100')
      .then((res) => res.json())
      .then((data) => setWorkOrders(data.data || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrderId: form.workOrderId,
          followUpAt: form.followUpAt,
          contactResult: form.contactResult || undefined,
          satisfaction: Number(form.satisfaction),
          issue: form.issue || undefined,
          remark: form.remark || undefined,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ workOrderId: '', followUpAt: '', contactResult: '', satisfaction: '5', issue: '', remark: '' });
        fetchFollowUps();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const satisfactionStars = (value: number | null) => {
    if (value === null) return '-';
    return '★'.repeat(value) + '☆'.repeat(5 - value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">回访管理</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '新建回访'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">新建回访</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">工单 *</label>
                <select
                  className="input-field"
                  value={form.workOrderId}
                  onChange={(e) => setForm({ ...form, workOrderId: e.target.value })}
                  required
                >
                  <option value="">请选择工单</option>
                  {workOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.orderNo} - {wo.vehicle?.plateNo} ({wo.customer?.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">回访时间 *</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={form.followUpAt}
                  onChange={(e) => setForm({ ...form, followUpAt: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系结果</label>
                <select
                  className="input-field"
                  value={form.contactResult}
                  onChange={(e) => setForm({ ...form, contactResult: e.target.value })}
                >
                  <option value="">请选择</option>
                  <option value="已联系">已联系</option>
                  <option value="无人接听">无人接听</option>
                  <option value="关机">关机</option>
                  <option value="拒绝接听">拒绝接听</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">满意度 (1-5)</label>
                <select
                  className="input-field"
                  value={form.satisfaction}
                  onChange={(e) => setForm({ ...form, satisfaction: e.target.value })}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} 分 {'★'.repeat(n)}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">问题</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.issue}
                  onChange={(e) => setForm({ ...form, issue: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '提交中...' : '创建回访'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : followUps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无回访记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">工单号</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">车牌号</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">客户</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">回访时间</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">联系结果</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">满意度</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">问题</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">是否解决</th>
                </tr>
              </thead>
              <tbody>
                {followUps.map((fu) => (
                  <tr key={fu.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">{fu.workOrder?.orderNo || fu.workOrderId.slice(0, 8)}</td>
                    <td className="py-3 px-2">{fu.workOrder?.vehicle?.plateNo || '-'}</td>
                    <td className="py-3 px-2">{fu.workOrder?.customer?.name || '-'}</td>
                    <td className="py-3 px-2">{new Date(fu.followUpAt).toLocaleString('zh-CN')}</td>
                    <td className="py-3 px-2">{fu.contactResult || '-'}</td>
                    <td className="py-3 px-2 text-yellow-500">{satisfactionStars(fu.satisfaction)}</td>
                    <td className="py-3 px-2">{fu.issue || '-'}</td>
                    <td className="py-3 px-2">
                      <span className={`badge-${fu.resolved ? 'completed' : 'created'}`}>
                        {fu.resolved ? '已解决' : '未解决'}
                      </span>
                    </td>
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
