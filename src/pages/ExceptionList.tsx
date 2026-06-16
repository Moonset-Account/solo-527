import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import type { ExceptionOrder } from '@/types';

const mockExceptions: ExceptionOrder[] = [
  { id: 1, type: 'room_conflict', sourceId: 1, sourceType: 'appointment', description: '望京SOHO-A1201 预约时间冲突：同一时段存在多个预约', status: 'open', handlerId: 0, handlerName: '', resolutionNote: '', createdAt: '2026-06-16T08:00:00', resolvedAt: '' },
  { id: 2, type: 'payment_failed', sourceId: 3, sourceType: 'payment', description: '租客张先生支付失败，重试3次仍无法完成', status: 'open', handlerId: 0, handlerName: '', resolutionNote: '', createdAt: '2026-06-16T07:30:00', resolvedAt: '' },
  { id: 3, type: 'system_error', sourceId: 5, sourceType: 'contract', description: '合同签署流程异常，状态未正确推进', status: 'processing', handlerId: 1, handlerName: '管理员', resolutionNote: '', createdAt: '2026-06-15T14:00:00', resolvedAt: '' },
  { id: 4, type: 'message_failed', sourceId: 8, sourceType: 'message', description: '短信通知发送失败，租客未收到验证码', status: 'resolved', handlerId: 2, handlerName: '运维A', resolutionNote: '已重新发送', createdAt: '2026-06-14T10:00:00', resolvedAt: '2026-06-14T10:30:00' },
];

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'room_conflict', label: '预约冲突' },
  { value: 'system_error', label: '系统错误' },
  { value: 'payment_failed', label: '支付失败' },
  { value: 'message_failed', label: '消息失败' },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'open', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
];

const typeLabels: Record<string, string> = {
  room_conflict: '预约冲突',
  system_error: '系统错误',
  payment_failed: '支付失败',
  message_failed: '消息失败',
};

export default function ExceptionList() {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = mockExceptions.filter((e) => {
    if (typeFilter && e.type !== typeFilter) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-[#F1F5F9]">异常处理</h2>

      <div className="flex items-center gap-3">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-[#1E293B] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none">
          {typeOptions.map((o) => <option key={o.value} value={o.value} className="bg-[#1E293B]">{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#1E293B] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none">
          {statusOptions.map((o) => <option key={o.value} value={o.value} className="bg-[#1E293B]">{o.label}</option>)}
        </select>
      </div>

      <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">类型</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">来源</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">描述</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">状态</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">处理人</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr
                key={e.id}
                className={`border-b border-[#334155]/50 hover:bg-[#334155]/30 ${
                  e.type === 'room_conflict' && e.status === 'open' ? 'animate-breathe border-2' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1">
                    {e.type === 'room_conflict' && <AlertTriangle size={14} className="text-rose-400" />}
                    <span className="text-[#CBD5E1]">{typeLabels[e.type]}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-[#CBD5E1]">{e.sourceType}#{e.sourceId}</td>
                <td className="px-4 py-3 text-[#CBD5E1] max-w-[300px] truncate">{e.description}</td>
                <td className="px-4 py-3"><StatusBadge status={e.status} pulse={e.status === 'open'} /></td>
                <td className="px-4 py-3 text-[#CBD5E1]">{e.handlerName || '-'}</td>
                <td className="px-4 py-3 text-[#CBD5E1]">{e.createdAt.replace('T', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
