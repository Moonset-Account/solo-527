'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils';
import { CreditCard, Plus, Banknote, Building } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  method: string;
  transactionId: string | null;
  notes: string | null;
  createdAt: string;
  invoice: {
    invoiceNumber: string;
    client: { name: string };
    project: { name: string };
  };
}

export default function PaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchPayments();
  }, [status, session]);

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      if (data.success) setPayments(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalReceived = payments.reduce((sum, p) => sum + parseFloat(p.amount as any), 0);

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'BANK': return <Building className="w-4 h-4" />;
      case 'CASH': return <Banknote className="w-4 h-4" />;
      case 'ONLINE': return <CreditCard className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      BANK: '银行转账',
      CASH: '现金',
      ONLINE: '在线支付',
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">收款记录</h1>
            <p className="text-gray-500 mt-1">
              共 {payments.length} 笔收款，总计 {formatCurrency(totalReceived)}
            </p>
          </div>
          <button className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition">
            <Plus className="w-5 h-5" />
            记录收款
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">累计收款</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalReceived)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">本月收款</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    payments
                      .filter((p) => new Date(p.paymentDate).getMonth() === new Date().getMonth())
                      .reduce((sum, p) => sum + parseFloat(p.amount as any), 0)
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-amber-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">收款笔数</p>
                <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">收款日期</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">发票编号</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">客户</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">项目</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">收款方式</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">交易号</th>
                  <th className="text-right px-5 py-3 text-sm font-medium text-gray-600">金额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4 text-sm text-gray-900">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-primary">
                        {payment.invoice?.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900">
                      {payment.invoice?.client?.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {payment.invoice?.project?.name}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        {getMethodIcon(payment.method)}
                        <span>{getMethodLabel(payment.method)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 font-mono">
                      {payment.transactionId || '-'}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-emerald-600">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {payments.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无收款记录</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
