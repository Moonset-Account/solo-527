import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { useExceptionStore } from '@/stores/exceptionStore';

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
  const { exceptions, loading, fetchExceptions } = useExceptionStore();
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params: Record<string, string | number> = {};
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    fetchExceptions(params);
  }, [typeFilter, statusFilter, fetchExceptions]);

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
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#F97316]" />
          </div>
        ) : (
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
              {exceptions.map((e) => (
                <tr
                  key={e.id}
                  className={`border-b border-[#334155]/50 hover:bg-[#334155]/30 cursor-pointer ${
                    e.type === 'room_conflict' && e.status === 'open' ? 'animate-breathe border-2' : ''
                  }`}
                  onClick={() => window.location.href = `/exceptions/${e.id}`}
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
              {exceptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#64748B]">暂无异常数据</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
