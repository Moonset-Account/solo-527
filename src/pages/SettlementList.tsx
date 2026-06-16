import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import type { Settlement } from '@/types';

const mockSettlements: Settlement[] = [
  { id: 1, contractId: 1, ownerId: 1, ownerName: '业主A', period: '2026年6月', amount: 6500, status: 'pending', approvedBy: '', approvedAt: '', remark: '', createdAt: '2026-06-01' },
  { id: 2, contractId: 2, ownerId: 2, ownerName: '业主B', period: '2026年6月', amount: 4200, status: 'pending', approvedBy: '', approvedAt: '', remark: '', createdAt: '2026-06-01' },
  { id: 3, contractId: 3, ownerId: 3, ownerName: '业主C', period: '2026年5月', amount: 8800, status: 'approved', approvedBy: '管理员', approvedAt: '2026-06-02', remark: '', createdAt: '2026-05-01' },
  { id: 4, contractId: 4, ownerId: 1, ownerName: '业主A', period: '2026年5月', amount: 5800, status: 'paid', approvedBy: '管理员', approvedAt: '2026-05-03', remark: '已打款', createdAt: '2026-05-01' },
  { id: 5, contractId: 5, ownerId: 4, ownerName: '业主D', period: '2026年4月', amount: 7200, status: 'rejected', approvedBy: '管理员', approvedAt: '2026-04-05', remark: '信息有误', createdAt: '2026-04-01' },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已审批' },
  { value: 'rejected', label: '已驳回' },
  { value: 'paid', label: '已支付' },
];

export default function SettlementList() {
  const [statusFilter, setStatusFilter] = useState('');
  const [showApprove, setShowApprove] = useState(false);
  const [selected, setSelected] = useState<Settlement | null>(null);
  const [approveAction, setApproveAction] = useState<'approve' | 'reject'>('approve');
  const [remark, setRemark] = useState('');

  const filtered = mockSettlements.filter((s) => !statusFilter || s.status === statusFilter);

  const openApprove = (s: Settlement, action: 'approve' | 'reject') => {
    setSelected(s);
    setApproveAction(action);
    setRemark('');
    setShowApprove(true);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-[#F1F5F9]">业主结算</h2>

      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#1E293B] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none">
          {statusOptions.map((o) => <option key={o.value} value={o.value} className="bg-[#1E293B]">{o.label}</option>)}
        </select>
      </div>

      <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">业主</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">结算周期</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">金额</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">状态</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">审批人</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                <td className="px-4 py-3">
                  <Link to={`/settlements/${s.id}`} className="text-[#F97316] hover:underline">{s.ownerName}</Link>
                </td>
                <td className="px-4 py-3 text-[#CBD5E1]">{s.period}</td>
                <td className="px-4 py-3 text-[#F1F5F9] font-medium">¥{s.amount.toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3 text-[#CBD5E1]">{s.approvedBy || '-'}</td>
                <td className="px-4 py-3">
                  {s.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => openApprove(s, 'approve')} className="flex items-center gap-1 text-xs text-emerald-400 hover:underline">
                        <CheckCircle size={14} /> 通过
                      </button>
                      <button onClick={() => openApprove(s, 'reject')} className="flex items-center gap-1 text-xs text-rose-400 hover:underline">
                        <XCircle size={14} /> 驳回
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showApprove} onClose={() => setShowApprove(false)} title={approveAction === 'approve' ? '审批通过' : '驳回结算'}>
        <div className="space-y-4">
          {selected && (
            <div className="p-4 rounded-lg bg-[#0F172A] border border-[#334155] text-center">
              <p className="text-sm text-[#94A3B8] mb-1">{selected.ownerName} · {selected.period}</p>
              <p className={`text-3xl font-bold ${approveAction === 'approve' ? 'text-emerald-400' : 'text-rose-400'}`}>
                ¥{selected.amount.toLocaleString()}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">备注</label>
            <textarea
              value={remark} onChange={(e) => setRemark(e.target.value)}
              className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none resize-none h-20"
              placeholder="输入审批备注"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowApprove(false)} className="px-4 py-2 rounded-lg text-sm text-[#94A3B8] hover:bg-[#334155]">取消</button>
            <button
              onClick={() => setShowApprove(false)}
              className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${
                approveAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {approveAction === 'approve' ? '确认通过' : '确认驳回'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
