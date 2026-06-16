import { useState, useEffect } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { useMessageStore } from '@/stores/messageStore';

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'sms', label: '短信' },
  { value: 'email', label: '邮件' },
  { value: 'push', label: '推送' },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待发送' },
  { value: 'sent', label: '已发送' },
  { value: 'failed', label: '失败' },
];

const typeLabels: Record<string, string> = { sms: '短信', email: '邮件', push: '推送' };

export default function MessageList() {
  const { messages, loading, retryLoading, fetchMessages, retryMessage } = useMessageStore();
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params: Record<string, string | number> = {};
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    fetchMessages(params);
  }, [typeFilter, statusFilter, fetchMessages]);

  const handleRetry = async (id: number) => {
    const success = await retryMessage(id);
    if (success) {
      const params: Record<string, string | number> = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      fetchMessages(params);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-[#F1F5F9]">消息记录</h2>

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
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">收件人</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">主题</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">状态</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">重试次数</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">创建时间</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                  <td className="px-4 py-3 text-[#CBD5E1]">{typeLabels[m.type]}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{m.recipientName}</td>
                  <td className="px-4 py-3 text-[#CBD5E1] max-w-[200px] truncate">{m.subject}</td>
                  <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{m.retryCount}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{m.createdAt.replace('T', ' ')}</td>
                  <td className="px-4 py-3">
                    {m.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(m.id)}
                        disabled={retryLoading === m.id}
                        className="flex items-center gap-1 text-xs text-[#F97316] hover:underline disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={retryLoading === m.id ? 'animate-spin' : ''} />
                        重试
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#64748B]">暂无消息数据</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
