import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import type { MessageRecord } from '@/types';

const mockMessages: MessageRecord[] = [
  { id: 1, type: 'sms', recipientId: 1, recipientName: '张先生', subject: '预约确认通知', content: '您的看房预约已确认...', status: 'sent', retryCount: 0, result: '', createdAt: '2026-06-16T09:00:00' },
  { id: 2, type: 'email', recipientId: 2, recipientName: '李女士', subject: '合同签署提醒', content: '您的合同待签署...', status: 'sent', retryCount: 0, result: '', createdAt: '2026-06-16T08:30:00' },
  { id: 3, type: 'sms', recipientId: 3, recipientName: '王先生', subject: '支付成功通知', content: '您的租金已支付成功...', status: 'failed', retryCount: 3, result: '号码无法接通', createdAt: '2026-06-16T07:00:00' },
  { id: 4, type: 'push', recipientId: 4, recipientName: '赵女士', subject: '维修完成通知', content: '您的维修工单已完成...', status: 'pending', retryCount: 0, result: '', createdAt: '2026-06-16T10:00:00' },
  { id: 5, type: 'email', recipientId: 5, recipientName: '孙先生', subject: '退租提醒', content: '您的租约即将到期...', status: 'failed', retryCount: 1, result: '邮箱地址错误', createdAt: '2026-06-15T16:00:00' },
];

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
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [retryLoading, setRetryLoading] = useState<number | null>(null);

  const filtered = mockMessages.filter((m) => {
    if (typeFilter && m.type !== typeFilter) return false;
    if (statusFilter && m.status !== statusFilter) return false;
    return true;
  });

  const handleRetry = async (id: number) => {
    setRetryLoading(id);
    setTimeout(() => setRetryLoading(null), 1000);
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
            {filtered.map((m) => (
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
