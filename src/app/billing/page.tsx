'use client';

import { useState } from 'react';
import UserLayout from '@/components/user/UserLayout';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { Download, Filter, FileText, Search, Calendar, ArrowUpDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const mockInvoices = [
  { id: 'inv_003', invoiceNumber: 'INV-2024-000003', amount: 299, status: 'DRAFT', date: '2024-07-10T00:00:00Z', period: '2024年8月', type: '专业版月度订阅' },
  { id: 'inv_002', invoiceNumber: 'INV-2024-000002', amount: 299, status: 'PAID', date: '2024-06-26T00:00:00Z', period: '2024年7月', type: '专业版月度订阅' },
  { id: 'inv_001', invoiceNumber: 'INV-2024-000001', amount: 299, status: 'PAID', date: '2024-05-26T00:00:00Z', period: '2024年6月', type: '专业版月度订阅' },
  { id: 'inv_005', invoiceNumber: 'INV-2024-000005', amount: 100, status: 'REFUNDED', date: '2024-05-20T00:00:00Z', period: '2024年5月', type: '部分退款' },
  { id: 'inv_004', invoiceNumber: 'INV-2024-000004', amount: 0, status: 'PAID', date: '2024-05-12T00:00:00Z', period: '试用期', type: '入门版14天试用' },
];

export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = mockInvoices.filter((inv) => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.period.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = mockInvoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amount, 0);

  const columns = [
    {
      key: 'invoice',
      header: '账单信息',
      accessor: (row: typeof mockInvoices[0]) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-lg">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.invoiceNumber}</p>
            <p className="text-xs text-slate-500">{row.type}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'period',
      header: '账期',
      accessor: (row: typeof mockInvoices[0]) => (
        <div>
          <p className="text-slate-900">{row.period}</p>
          <p className="text-xs text-slate-500">{formatDate(row.date)}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: '金额',
      accessor: (row: typeof mockInvoices[0]) => (
        <div className="text-right">
          <p className="font-semibold text-slate-900">{formatCurrency(row.amount)}</p>
        </div>
      ),
      className: 'text-right',
    },
    {
      key: 'status',
      header: '状态',
      accessor: (row: typeof mockInvoices[0]) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '操作',
      accessor: (row: typeof mockInvoices[0]) => (
        <div className="flex items-center gap-2 justify-end">
          <button className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <UserLayout>
      <div className="page-container">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-slate-900">账单中心</h1>
          <p className="mt-2 text-slate-500">查看和管理您的所有订阅账单</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 animate-slide-up">
            <p className="text-sm text-slate-500 mb-1">累计支付</p>
            <p className="font-display text-2xl font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-slate-400 mt-1">共 {mockInvoices.filter(i => i.status === 'PAID').length} 笔</p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <p className="text-sm text-slate-500 mb-1">本月账单</p>
            <p className="font-display text-2xl font-bold text-warning-600">{formatCurrency(299)}</p>
            <p className="text-xs text-slate-400 mt-1">待支付</p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <p className="text-sm text-slate-500 mb-1">累计退款</p>
            <p className="font-display text-2xl font-bold text-danger-600">{formatCurrency(100)}</p>
            <p className="text-xs text-slate-400 mt-1">共 1 笔退款</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-lg font-bold text-slate-900">账单记录</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索账单..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full sm:w-48"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="all">全部状态</option>
                <option value="PAID">已支付</option>
                <option value="DRAFT">草稿</option>
                <option value="OPEN">待支付</option>
                <option value="REFUNDED">已退款</option>
              </select>
              
              <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>
                导出
              </Button>
            </div>
          </div>

          <DataTable
            columns={columns as any[]}
            data={filteredInvoices}
            onRowClick={() => {}}
          />
        </div>
      </div>
    </UserLayout>
  );
}
