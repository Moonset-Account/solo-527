import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import type { Contract } from '@/types';

const mockContracts: Contract[] = [
  { id: 1, templateId: 1, roomId: 1, roomName: '望京SOHO-A1201', tenantId: 1, tenantName: '张先生', ownerId: 1, ownerName: '业主A', startDate: '2026-03-01', endDate: '2027-02-28', monthlyRent: 6500, deposit: 13000, status: 'draft', content: '', signedAt: '', createdAt: '2026-06-16' },
  { id: 2, templateId: 1, roomId: 2, roomName: '中关村-B0803', tenantId: 2, tenantName: '李女士', ownerId: 2, ownerName: '业主B', startDate: '2026-04-01', endDate: '2027-03-31', monthlyRent: 4200, deposit: 8400, status: 'owner_signed', content: '', signedAt: '2026-06-15', createdAt: '2026-06-13' },
  { id: 3, templateId: 2, roomId: 3, roomName: '望京SOHO-A1203', tenantId: 3, tenantName: '王先生', ownerId: 3, ownerName: '业主C', startDate: '2026-05-01', endDate: '2027-04-30', monthlyRent: 8800, deposit: 17600, status: 'tenant_signed', content: '', signedAt: '2026-06-14', createdAt: '2026-06-10' },
  { id: 4, templateId: 1, roomId: 4, roomName: '朝阳区-C0502', tenantId: 4, tenantName: '赵女士', ownerId: 1, ownerName: '业主A', startDate: '2026-02-01', endDate: '2027-01-31', monthlyRent: 5800, deposit: 11600, status: 'archived', content: '', signedAt: '2026-01-30', createdAt: '2026-01-25' },
  { id: 5, templateId: 2, roomId: 5, roomName: '海淀区-D1101', tenantId: 5, tenantName: '孙先生', ownerId: 4, ownerName: '业主D', startDate: '2026-01-01', endDate: '2026-12-31', monthlyRent: 7200, deposit: 14400, status: 'terminated', content: '', signedAt: '2025-12-28', createdAt: '2025-12-20' },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'owner_signed', label: '业主已签' },
  { value: 'tenant_signed', label: '租客已签' },
  { value: 'archived', label: '已归档' },
  { value: 'terminated', label: '已终止' },
];

const steps = ['草稿', '业主签署', '租客签署', '归档'] as const;

function StepProgress({ status }: { status: Contract['status'] }) {
  const stepMap: Record<string, number> = { draft: 0, owner_signed: 1, tenant_signed: 2, archived: 3, terminated: -1 };
  const current = stepMap[status] ?? 0;
  if (status === 'terminated') {
    return <span className="text-xs text-rose-400 font-medium">已终止</span>;
  }
  return (
    <div className="flex items-center gap-1">
      {steps.map((_, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
            i <= current ? 'bg-[#F97316] text-white' : 'bg-[#334155] text-[#94A3B8]'
          }`}>
            {i < current ? <CheckCircle size={12} /> : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 h-0.5 ${i < current ? 'bg-[#F97316]' : 'bg-[#334155]'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ContractList() {
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = mockContracts.filter((c) => !statusFilter || c.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-[#F1F5F9]">合同签署</h2>
        <Link to="/contracts/templates" className="text-sm text-[#F97316] hover:underline">模板管理</Link>
      </div>

      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#1E293B] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none">
          {statusOptions.map((o) => <option key={o.value} value={o.value} className="bg-[#1E293B]">{o.label}</option>)}
        </select>
      </div>

      <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">房源</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">租客</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">业主</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">租期</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">月租</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">状态</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">签署进度</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                <td className="px-4 py-3">
                  <Link to={`/contracts/${c.id}`} className="text-[#F97316] hover:underline">{c.roomName}</Link>
                </td>
                <td className="px-4 py-3 text-[#CBD5E1]">{c.tenantName}</td>
                <td className="px-4 py-3 text-[#CBD5E1]">{c.ownerName}</td>
                <td className="px-4 py-3 text-[#CBD5E1] whitespace-nowrap">{c.startDate} ~ {c.endDate}</td>
                <td className="px-4 py-3 text-[#CBD5E1]">¥{c.monthlyRent}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3"><StepProgress status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
