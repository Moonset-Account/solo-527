'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

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

const STATUS_TRANSITIONS: Record<string, string[]> = {
  CREATED: ['INSPECTING', 'ABNORMAL_CLOSED'],
  INSPECTING: ['QUOTED', 'ABNORMAL_CLOSED'],
  QUOTED: ['APPROVED', 'ABNORMAL_CLOSED'],
  APPROVED: ['IN_PROGRESS', 'ABNORMAL_CLOSED'],
  IN_PROGRESS: ['PARTS_WAITING', 'TEST_DRIVE', 'COMPLETED', 'ABNORMAL_CLOSED'],
  PARTS_WAITING: ['IN_PROGRESS', 'ABNORMAL_CLOSED'],
  TEST_DRIVE: ['COMPLETED', 'ABNORMAL_CLOSED'],
  COMPLETED: ['CASHIERED'],
  ABNORMAL_CLOSED: [],
  CASHIERED: [],
};

interface WorkOrder {
  id: string;
  orderNo: string;
  status: string;
  totalAmount: number | null;
  abnormalReason: string | null;
  createdAt: string;
  vehicle: { plateNo: string; brand: string; model: string; year: number | null; vin: string | null; mileage: number | null };
  customer: { name: string; phone: string };
  technician: { id: string; name: string } | null;
  items: WorkOrderItem[];
  parts: WorkOrderPart[];
  statusLogs: StatusLog[];
  testDrives: TestDrive[];
  cashierOrders: CashierOrder[];
  partShortages: PartShortage[];
}

interface WorkOrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  laborFee: number;
  status: string;
  remark: string | null;
}

interface WorkOrderPart {
  id: string;
  partId: string;
  part: { name: string; partNo: string };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
}

interface StatusLog {
  id: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string | null;
  changeReason: string | null;
  snapshot: Record<string, unknown> | null;
  createdAt: string;
}

interface TestDrive {
  id: string;
  startTime: string;
  endTime: string | null;
  driverName: string;
  mileage: number | null;
  remark: string | null;
  createdAt: string;
}

interface CashierOrder {
  id: string;
  orderNo: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMethod: string | null;
  paymentStatus: string;
  previousAmount: number | null;
  amountChanged: boolean;
  changeReason: string | null;
  createdAt: string;
}

interface PartShortage {
  id: string;
  workOrderPartId: string;
  workOrderPart: { part: { name: string } };
  handledBy: string | null;
  handleResult: string | null;
  handledAt: string | null;
  status: string;
  createdAt: string;
}

interface Part {
  id: string;
  name: string;
  partNo: string;
  price: number;
  stock: number;
  unit: string;
}

export default function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAbnormalModal, setShowAbnormalModal] = useState(false);
  const [abnormalReason, setAbnormalReason] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [showPartForm, setShowPartForm] = useState(false);
  const [partForm, setPartForm] = useState({ partId: '', quantity: 1, unitPrice: 0 });
  const [showTestDriveForm, setShowTestDriveForm] = useState(false);
  const [testDriveForm, setTestDriveForm] = useState({ startTime: '', driverName: '', mileage: '', remark: '' });
  const [shortageForm, setShortageForm] = useState({ shortageId: '', handledBy: '', handleResult: '' });
  const [markShortageForm, setMarkShortageForm] = useState({ workOrderPartId: '', markedBy: '', remark: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    fetch(`/api/workorders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setWorkOrder(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    fetch('/api/parts')
      .then((res) => res.json())
      .then((data) => setParts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleStatusTransition = async (toStatus: string) => {
    if (toStatus === 'ABNORMAL_CLOSED') {
      setShowAbnormalModal(true);
      return;
    }
    setTransitioning(true);
    try {
      const res = await fetch(`/api/workorders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } finally {
      setTransitioning(false);
    }
  };

  const handleAbnormalClose = async () => {
    if (!abnormalReason.trim()) return;
    setTransitioning(true);
    try {
      const res = await fetch(`/api/workorders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus: 'ABNORMAL_CLOSED', abnormalReason }),
      });
      if (res.ok) {
        setShowAbnormalModal(false);
        setAbnormalReason('');
        fetchData();
      }
    } finally {
      setTransitioning(false);
    }
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/workorders/${id}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: partForm.partId,
          quantity: Number(partForm.quantity),
          unitPrice: Number(partForm.unitPrice),
        }),
      });
      if (res.ok) {
        setShowPartForm(false);
        setPartForm({ partId: '', quantity: 1, unitPrice: 0 });
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTestDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/workorders/${id}/test-drives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: testDriveForm.startTime,
          driverName: testDriveForm.driverName,
          mileage: testDriveForm.mileage ? Number(testDriveForm.mileage) : undefined,
          remark: testDriveForm.remark || undefined,
        }),
      });
      if (res.ok) {
        setShowTestDriveForm(false);
        setTestDriveForm({ startTime: '', driverName: '', mileage: '', remark: '' });
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleShortage = async (shortageId: string) => {
    if (!shortageForm.handledBy || !shortageForm.handleResult) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/workorders/${id}/shortages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortageId,
          handledBy: shortageForm.handledBy,
          handleResult: shortageForm.handleResult,
        }),
      });
      if (res.ok) {
        setShortageForm({ shortageId: '', handledBy: '', handleResult: '' });
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkShortage = async (workOrderPartId: string) => {
    const markedBy = markShortageForm.workOrderPartId === workOrderPartId ? markShortageForm.markedBy.trim() : '';
    if (!markedBy) {
      alert('请填写标记人');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/workorders/${id}/shortages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark',
          workOrderPartId,
          markedBy,
          remark: markShortageForm.workOrderPartId === workOrderPartId ? markShortageForm.remark : undefined,
        }),
      });
      if (res.ok) {
        setMarkShortageForm({ workOrderPartId: '', markedBy: '', remark: '' });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || '标记失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-500">加载中...</div>;
  if (!workOrder) return <div className="text-center py-16 text-gray-500">工单不存在</div>;

  const allowedTransitions = STATUS_TRANSITIONS[workOrder.status] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/workorders" className="text-gray-500 hover:text-gray-700">← 返回列表</Link>
        <h1 className="text-2xl font-bold">工单详情</h1>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">基本信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">工单号：</span>{workOrder.orderNo}</div>
          <div><span className="text-gray-500">状态：</span><span className={`badge-${workOrder.status.toLowerCase()}`}>{STATUS_LABELS[workOrder.status]}</span></div>
          <div><span className="text-gray-500">金额：</span>{workOrder.totalAmount != null ? `¥${Number(workOrder.totalAmount).toFixed(2)}` : '-'}</div>
          <div><span className="text-gray-500">车牌号：</span>{workOrder.vehicle?.plateNo}</div>
          <div><span className="text-gray-500">车型：</span>{workOrder.vehicle?.brand} {workOrder.vehicle?.model}</div>
          <div><span className="text-gray-500">VIN：</span>{workOrder.vehicle?.vin || '-'}</div>
          <div><span className="text-gray-500">客户：</span>{workOrder.customer?.name}</div>
          <div><span className="text-gray-500">电话：</span>{workOrder.customer?.phone}</div>
          <div><span className="text-gray-500">技师：</span>{workOrder.technician?.name || '-'}</div>
          <div><span className="text-gray-500">里程：</span>{workOrder.vehicle?.mileage ? `${workOrder.vehicle.mileage}km` : '-'}</div>
          <div><span className="text-gray-500">创建时间：</span>{new Date(workOrder.createdAt).toLocaleString('zh-CN')}</div>
          {workOrder.abnormalReason && <div className="md:col-span-3"><span className="text-gray-500">异常原因：</span><span className="text-red-600">{workOrder.abnormalReason}</span></div>}
        </div>
      </div>

      {allowedTransitions.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">状态操作</h2>
          <div className="flex flex-wrap gap-3">
            {allowedTransitions.map((nextStatus) => (
              <button
                key={nextStatus}
                onClick={() => handleStatusTransition(nextStatus)}
                disabled={transitioning}
                className={nextStatus === 'ABNORMAL_CLOSED' ? 'btn-danger' : 'btn-primary'}
              >
                {transitioning ? '处理中...' : `转为${STATUS_LABELS[nextStatus]}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {showAbnormalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">异常关闭</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">异常原因</label>
              <textarea
                className="input-field"
                rows={3}
                value={abnormalReason}
                onChange={(e) => setAbnormalReason(e.target.value)}
                placeholder="请输入异常关闭原因"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setShowAbnormalModal(false)}>取消</button>
              <button className="btn-danger" onClick={handleAbnormalClose} disabled={transitioning || !abnormalReason.trim()}>
                {transitioning ? '处理中...' : '确认关闭'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">服务项目</h2>
        {workOrder.items.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无服务项目</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-600">名称</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">分类</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">价格</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">工时费</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">状态</th>
                </tr>
              </thead>
              <tbody>
                {workOrder.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2 px-2">{item.name}</td>
                    <td className="py-2 px-2">{item.category}</td>
                    <td className="py-2 px-2">¥{Number(item.price).toFixed(2)}</td>
                    <td className="py-2 px-2">¥{Number(item.laborFee).toFixed(2)}</td>
                    <td className="py-2 px-2">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">配件列表</h2>
          <button className="btn-primary text-sm" onClick={() => setShowPartForm(!showPartForm)}>
            添加配件
          </button>
        </div>
        {showPartForm && (
          <form onSubmit={handleAddPart} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                className="input-field"
                value={partForm.partId}
                onChange={(e) => {
                  const part = parts.find((p) => p.id === e.target.value);
                  setPartForm({
                    ...partForm,
                    partId: e.target.value,
                    unitPrice: part ? Number(part.price) : 0,
                  });
                }}
                required
              >
                <option value="">选择配件</option>
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.partNo})</option>
                ))}
              </select>
              <input
                type="number"
                className="input-field"
                placeholder="数量"
                min={1}
                value={partForm.quantity}
                onChange={(e) => setPartForm({ ...partForm, quantity: Number(e.target.value) })}
                required
              />
              <input
                type="number"
                className="input-field"
                placeholder="单价"
                step="0.01"
                value={partForm.unitPrice}
                onChange={(e) => setPartForm({ ...partForm, unitPrice: Number(e.target.value) })}
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary text-sm" disabled={submitting}>
                {submitting ? '提交中...' : '确认添加'}
              </button>
              <button type="button" className="btn-secondary text-sm" onClick={() => setShowPartForm(false)}>取消</button>
            </div>
          </form>
        )}
        {workOrder.parts.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无配件</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-600">配件名</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">编号</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">数量</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">单价</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">总价</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">状态</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {workOrder.parts.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="py-2 px-2">{p.part?.name}</td>
                    <td className="py-2 px-2">{p.part?.partNo}</td>
                    <td className="py-2 px-2">{p.quantity}</td>
                    <td className="py-2 px-2">¥{Number(p.unitPrice).toFixed(2)}</td>
                    <td className="py-2 px-2">¥{Number(p.totalPrice).toFixed(2)}</td>
                    <td className="py-2 px-2">
                      <span className={p.status === 'shortage' ? 'text-orange-600 font-medium' : ''}>
                        {p.status === 'pending' ? '待处理' : p.status === 'available' ? '已就绪' : p.status === 'shortage' ? '缺货' : p.status}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      {p.status !== 'shortage' && workOrder.status !== 'CASHIERED' && workOrder.status !== 'ABNORMAL_CLOSED' ? (
                        markShortageForm.workOrderPartId === p.id ? (
                          <div className="space-y-1 min-w-[200px]">
                            <input
                              type="text"
                              className="input-field text-xs py-1"
                              placeholder="标记人"
                              value={markShortageForm.markedBy}
                              onChange={(e) => setMarkShortageForm({ ...markShortageForm, workOrderPartId: p.id, markedBy: e.target.value })}
                            />
                            <input
                              type="text"
                              className="input-field text-xs py-1"
                              placeholder="备注(可选)"
                              value={markShortageForm.remark}
                              onChange={(e) => setMarkShortageForm({ ...markShortageForm, workOrderPartId: p.id, remark: e.target.value })}
                            />
                            <div className="flex gap-1">
                              <button
                                className="btn-danger text-xs py-1 px-2"
                                onClick={() => handleMarkShortage(p.id)}
                                disabled={submitting}
                              >
                                确认标记
                              </button>
                              <button
                                className="btn-secondary text-xs py-1 px-2"
                                onClick={() => setMarkShortageForm({ workOrderPartId: '', markedBy: '', remark: '' })}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="btn-secondary text-xs py-1 px-2"
                            onClick={() => setMarkShortageForm({ workOrderPartId: p.id, markedBy: '', remark: '' })}
                          >
                            标记缺货
                          </button>
                        )
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">缺货处理</h2>
        {workOrder.partShortages.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无缺货记录</p>
        ) : (
          <div className="space-y-3">
            {workOrder.partShortages.map((shortage) => (
              <div key={shortage.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{shortage.workOrderPart?.part?.name || '未知配件'}</span>
                  <span className={`badge-${shortage.status === 'resolved' ? 'completed' : 'created'}`}>
                    {shortage.status === 'resolved' ? '已处理' : '待处理'}
                  </span>
                </div>
                {shortage.status === 'resolved' ? (
                  <div className="text-sm text-gray-600">
                    <span>处理人：{shortage.handledBy} | 结果：{shortage.handleResult} | 处理时间：{shortage.handledAt ? new Date(shortage.handledAt).toLocaleString('zh-CN') : '-'}</span>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      className="input-field"
                      placeholder="处理人"
                      value={shortageForm.shortageId === shortage.id ? shortageForm.handledBy : ''}
                      onChange={(e) => setShortageForm({ ...shortageForm, shortageId: shortage.id, handledBy: e.target.value })}
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="处理结果"
                      value={shortageForm.shortageId === shortage.id ? shortageForm.handleResult : ''}
                      onChange={(e) => setShortageForm({ ...shortageForm, shortageId: shortage.id, handleResult: e.target.value })}
                    />
                    <button
                      className="btn-primary text-sm"
                      onClick={() => handleShortage(shortage.id)}
                      disabled={submitting}
                    >
                      提交处理
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">试驾记录</h2>
          <button className="btn-primary text-sm" onClick={() => setShowTestDriveForm(!showTestDriveForm)}>
            添加试驾
          </button>
        </div>
        {showTestDriveForm && (
          <form onSubmit={handleAddTestDrive} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">开始时间</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={testDriveForm.startTime}
                  onChange={(e) => setTestDriveForm({ ...testDriveForm, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">试驾人</label>
                <input
                  type="text"
                  className="input-field"
                  value={testDriveForm.driverName}
                  onChange={(e) => setTestDriveForm({ ...testDriveForm, driverName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">里程(km)</label>
                <input
                  type="number"
                  className="input-field"
                  value={testDriveForm.mileage}
                  onChange={(e) => setTestDriveForm({ ...testDriveForm, mileage: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">备注</label>
                <input
                  type="text"
                  className="input-field"
                  value={testDriveForm.remark}
                  onChange={(e) => setTestDriveForm({ ...testDriveForm, remark: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary text-sm" disabled={submitting}>
                {submitting ? '提交中...' : '确认添加'}
              </button>
              <button type="button" className="btn-secondary text-sm" onClick={() => setShowTestDriveForm(false)}>取消</button>
            </div>
          </form>
        )}
        {workOrder.testDrives.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无试驾记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-600">开始时间</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">结束时间</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">试驾人</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">里程</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">备注</th>
                </tr>
              </thead>
              <tbody>
                {workOrder.testDrives.map((td) => (
                  <tr key={td.id} className="border-b border-gray-100">
                    <td className="py-2 px-2">{new Date(td.startTime).toLocaleString('zh-CN')}</td>
                    <td className="py-2 px-2">{td.endTime ? new Date(td.endTime).toLocaleString('zh-CN') : '-'}</td>
                    <td className="py-2 px-2">{td.driverName}</td>
                    <td className="py-2 px-2">{td.mileage ? `${td.mileage}km` : '-'}</td>
                    <td className="py-2 px-2">{td.remark || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">收银记录</h2>
        {workOrder.cashierOrders.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无收银记录</p>
        ) : (
          <div className="space-y-3">
            {workOrder.cashierOrders.map((co) => (
              <div key={co.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{co.orderNo}</span>
                  <span className="text-sm text-gray-500">{new Date(co.createdAt).toLocaleString('zh-CN')}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>总金额：¥{Number(co.totalAmount).toFixed(2)} | 折扣：¥{Number(co.discount).toFixed(2)} | 实付：¥{Number(co.finalAmount).toFixed(2)}</div>
                  <div>支付方式：{co.paymentMethod || '-'} | 支付状态：{co.paymentStatus}</div>
                  {co.amountChanged && (
                    <div className="text-orange-600">
                      金额变更：原 ¥{Number(co.previousAmount || 0).toFixed(2)} → 现 ¥{Number(co.finalAmount).toFixed(2)}
                      {co.changeReason && <span className="ml-2">({co.changeReason})</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">状态变更日志</h2>
        {workOrder.statusLogs.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无日志</p>
        ) : (
          <div className="space-y-0">
            {workOrder.statusLogs.map((log, idx) => (
              <div key={log.id} className="flex gap-4 pb-4 relative">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5" />
                  {idx < workOrder.statusLogs.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="text-sm">
                    <span className={`badge-${log.fromStatus.toLowerCase()}`}>{STATUS_LABELS[log.fromStatus]}</span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className={`badge-${log.toStatus.toLowerCase()}`}>{STATUS_LABELS[log.toStatus]}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {log.changedBy && <span>操作人：{log.changedBy} | </span>}
                    {log.changeReason && <span>原因：{log.changeReason} | </span>}
                    {new Date(log.createdAt).toLocaleString('zh-CN')}
                  </div>
                  {log.snapshot && (
                    <details className="mt-1">
                      <summary className="text-xs text-gray-400 cursor-pointer">快照详情</summary>
                      <pre className="text-xs text-gray-500 mt-1 bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(log.snapshot, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
