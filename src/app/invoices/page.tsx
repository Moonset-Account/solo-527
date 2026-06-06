'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Receipt, Plus, Download, Send, Mail } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  amountPaid: number;
  status: string;
  issueDate: string;
  dueDate: string;
  client: { name: string };
  project: { name: string };
}

export default function InvoicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    fetchInvoices();
  }, [status, statusFilter]);

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/invoices?${params}`);
      const data = await res.json();
      if (data.success) setInvoices(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = invoices.reduce((sum, i) => sum + parseFloat(i.total as any), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + parseFloat(i.amountPaid as any), 0);
  const statuses = ['ALL', 'DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE'];

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
            <h1 className="text-2xl font-bold text-gray-900">发票管理</h1>
            <p className="text-gray-500 mt-1">
              共 {invoices.length} 张发票，总金额 {formatCurrency(totalAmount)}
            </p>
          </div>
          {session?.user?.role === 'ADMIN' && (
            <button className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition">
              <Plus className="w-5 h-5" />
              新建发票
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">状态筛选:</span>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  statusFilter === s
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'ALL' ? '全部' : getStatusLabel(s)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">发票编号</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">客户</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">项目</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">开票日期</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">到期日期</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">状态</th>
                  <th className="text-right px-5 py-3 text-sm font-medium text-gray-600">金额</th>
                  <th className="text-right px-5 py-3 text-sm font-medium text-gray-600">已收</th>
                  <th className="text-center px-5 py-3 text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <span className="font-medium text-primary">{invoice.invoiceNumber}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900">{invoice.client?.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{invoice.project?.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{formatDate(invoice.issueDate)}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{formatDate(invoice.dueDate)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-emerald-600 font-medium">
                      {formatCurrency(invoice.amountPaid)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 hover:bg-gray-100 rounded transition" title="发送">
                          <Mail className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 rounded transition" title="下载PDF">
                          <Download className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invoices.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无发票数据</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
