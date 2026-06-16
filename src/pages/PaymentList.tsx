import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import type { PaymentRecord } from '@/types';

const mockPayments: PaymentRecord[] = [
  { id: 1, contractId: 1, tenantId: 1, tenantName: '张先生', amount: 6500, method: 'alipay', status: 'success', retryCount: 0, result: '', transactionId: 'ALI20260616001', createdAt: '2026-06-16T09:00:00' },
  { id: 2, contractId: 2, tenantId: 2, tenantName: '李女士', amount: 4200, method: 'wechat', status: 'success', retryCount: 0, result: '', transactionId: 'WX20260616002', createdAt: '2026-06-16T08:30:00' },
  { id: 3, contractId: 3, tenantId: 3, tenantName: '王先生', amount: 8800, method: 'bank', status: 'failed', retryCount: 3, result: '银行卡余额不足', transactionId: '', createdAt: '2026-06-16T07:00:00' },
  { id: 4, contractId: 1, tenantId: 1, tenantName: '张先生', amount: 6500, method: 'alipay', status: 'pending', retryCount: 0, result: '', transactionId: '', createdAt: '2026-06-15T00:00:00' },
  { id: 5, contractId: 4, tenantId: 4, tenantName: '赵女士', amount: 5800, method: 'wechat', status: 'failed', retryCount: 1, result: '支付超时', transactionId: '', createdAt: '2026-06-14T16:00:00' },
];

const methodOptions = [
  { value: '', label: '全部方式' },
  { value: 'alipay', label: '支付宝' },
  { value: 'wechat', label: '微信' },
  { value: 'bank', label: '银行转账' },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待支付' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失败' },
];

const methodLabels: Record<string, string> = { alipay: '支付宝', wechat: '微信', bank: '银行转账' };

export default function PaymentList() {
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [retryLoading, setRetryLoading] = useState<number | null>(null);

  const filtered = mockPayments.filter((p) => {
    if (methodFilter && p.method !== methodFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  const handleRetry = async (id: number) => {
    setRetryLoading(id);
    setTimeout(() => setRetryLoading(null), 1000);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-[#F1F5F9]">支付流水</h2>

      <div className="flex items-center gap-3">
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="bg-[#1E293B] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none">
          {methodOptions.map((o) => <option key={o.value} value={o.value} className="bg-[#1E293B]">{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#1E293B] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none">
          {statusOptions.map((o) => <option key={o.value} value={o.value} className="bg-[#1E293B]">{o.label}</option>)}
        </select>
      </div>

      <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">租客</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">合同</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">金额</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">支付方式</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">状态</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">交易号</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">创建时间</th>
              <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                <td className="px-4 py-3 text-[#CBD5E1]">{p.tenantName}</td>
                <td className="px-4 py-3 text-[#CBD5E1]">#{p.contractId}</td>
                <td className="px-4 py-3 text-[#F1F5F9] font-medium">¥{p.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-[#CBD5E1]">{methodLabels[p.method]}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-[#CBD5E1] font-mono text-xs">{p.transactionId || '-'}</td>
                <td className="px-4 py-3 text-[#CBD5E1]">{p.createdAt.replace('T', ' ')}</td>
                <td className="px-4 py-3">
                  {p.status === 'failed' && (
                    <button
                      onClick={() => handleRetry(p.id)}
                      disabled={retryLoading === p.id}
                      className="flex items-center gap-1 text-xs text-[#F97316] hover:underline disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={retryLoading === p.id ? 'animate-spin' : ''} />
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
