import { useState, useEffect } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { usePaymentStore } from '@/stores/paymentStore';

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
  const { payments, loading, retryLoading, fetchPayments, retryPayment } = usePaymentStore();
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params: Record<string, string | number> = {};
    if (methodFilter) params.method = methodFilter;
    if (statusFilter) params.status = statusFilter;
    fetchPayments(params);
  }, [methodFilter, statusFilter, fetchPayments]);

  const handleRetry = async (id: number) => {
    const success = await retryPayment(id);
    if (success) {
      const params: Record<string, string | number> = {};
      if (methodFilter) params.method = methodFilter;
      if (statusFilter) params.status = statusFilter;
      fetchPayments(params);
    }
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
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#F97316]" />
          </div>
        ) : (
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
              {payments.map((p) => (
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
              {payments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#64748B]">暂无支付数据</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
