'use client';

import { useMemo, useState } from 'react';
import UserLayout from '@/components/user/UserLayout';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import {
  Download,
  FileText,
  Search,
  ArrowRight,
  CreditCard,
  History,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Plan, Subscription, Invoice, ChangeLog } from '@/types';
import { useToast } from '@/components/ui/Toast';

interface InvoiceRow extends Invoice {
  period: string;
  type: string;
}

interface Props {
  initialInvoices: InvoiceRow[];
  stats: {
    totalPaid: number;
    paidCount: number;
    pendingAmount: number;
    refundedTotal: number;
    refundedCount: number;
  };
  subscription: (Subscription & { plan?: Plan }) | null;
  changeLogs: ChangeLog[];
}

export default function BillingClientView({
  initialInvoices,
  stats,
  subscription,
  changeLogs,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = useMemo(() => {
    return initialInvoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.period || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.type || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [initialInvoices, searchQuery, statusFilter]);

  const columns = [
    {
      key: 'invoice',
      header: '账单信息',
      accessor: (row: InvoiceRow) => (
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
      accessor: (row: InvoiceRow) => (
        <div>
          <p className="text-slate-900">{row.period}</p>
          <p className="text-xs text-slate-500">{formatDate(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: '金额',
      accessor: (row: InvoiceRow) => (
        <div className="text-right">
          <p className="font-semibold text-slate-900">{formatCurrency(Number(row.amount))}</p>
          {row.status === 'PARTIALLY_REFUNDED' && (
            <p className="text-xs text-warning-600">部分退款</p>
          )}
        </div>
      ),
      className: 'text-right',
    },
    {
      key: 'status',
      header: '状态',
      accessor: (row: InvoiceRow) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '操作',
      accessor: (row: InvoiceRow) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="下载发票"
            onClick={() => {
              toast.show({
                variant: 'info',
                message: '下载已开始',
                description: `${row.invoiceNumber} 的发票 PDF 正在生成`,
              });
            }}
          >
            <Download className="w-4 h-4" />
          </button>
          <Link
            href={`/billing/${row.id}`}
            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="查看详情"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
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
          <p className="mt-2 text-slate-500">
            查看和管理您的所有订阅账单
            {subscription?.plan && (
              <span className="ml-2 text-slate-400 text-sm">
                · 当前套餐：{subscription.plan.name}
                <StatusBadge status={subscription.status} />
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">累计支付</p>
              <div className="p-1.5 rounded-lg bg-success-50 text-success-600">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-slate-900">{formatCurrency(stats.totalPaid)}</p>
            <p className="text-xs text-slate-400 mt-1">共 {stats.paidCount} 笔已支付</p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">待支付</p>
              <div className="p-1.5 rounded-lg bg-warning-50 text-warning-600">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <p className={cn(
              'font-display text-2xl font-bold',
              stats.pendingAmount > 0 ? 'text-warning-600' : 'text-slate-400'
            )}>
              {formatCurrency(stats.pendingAmount)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {stats.pendingAmount > 0
                ? '请在到期日前完成支付'
                : '暂无待支付账单'}
            </p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">累计退款</p>
              <div className="p-1.5 rounded-lg bg-danger-50 text-danger-600">
                <History className="w-4 h-4" />
              </div>
            </div>
            <p className={cn(
              'font-display text-2xl font-bold',
              stats.refundedTotal > 0 ? 'text-danger-600' : 'text-slate-400'
            )}>
              {formatCurrency(stats.refundedTotal)}
            </p>
            <p className="text-xs text-slate-400 mt-1">共 {stats.refundedCount} 笔退款</p>
          </div>
        </div>

        {changeLogs && changeLogs.length > 0 && (
          <div className="card p-5 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                最近订阅变更
              </p>
              <Link
                href="/pricing"
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                变更套餐 →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {changeLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50"
                >
                  <span className={cn(
                    'flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold',
                    log.type === 'UPGRADE' ? 'bg-success-100 text-success-700' :
                    log.type === 'DOWNGRADE' ? 'bg-warning-100 text-warning-700' :
                    log.type === 'CANCEL' ? 'bg-danger-100 text-danger-700' :
                    'bg-primary-100 text-primary-700'
                  )}>
                    {describeChange(log.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 line-clamp-1">
                      {log.note || `${log.oldValue || '-'} → ${log.newValue || '-'}`}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              账单记录
              <span className="ml-2 text-xs text-slate-400 font-normal">
                共 {filteredInvoices.length} / {initialInvoices.length} 条
              </span>
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索账单号/账期..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full sm:w-56"
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
                <option value="PARTIALLY_REFUNDED">部分退款</option>
                <option value="UNCOLLECTIBLE">坏账</option>
              </select>

              <Button
                variant="secondary"
                size="sm"
                icon={<Download className="w-4 h-4" />}
                onClick={() => {
                  toast.show({
                    variant: 'success',
                    message: '导出请求已提交',
                    description: `将导出 ${filteredInvoices.length} 条账单记录为 CSV 文件`,
                  });
                }}
              >
                导出
              </Button>
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-10 h-10" />}
              title={searchQuery || statusFilter !== 'all' ? '未找到匹配的账单' : '暂无账单记录'}
              description={
                searchQuery || statusFilter !== 'all'
                  ? '请调整搜索条件或筛选状态'
                  : '开通套餐后，账单将自动生成并展示在这里。'
              }
              compact
              action={
                searchQuery || statusFilter !== 'all' ? undefined : (
                  <Link href="/pricing">
                    <Button size="sm">选择套餐</Button>
                  </Link>
                )
              }
            />
          ) : (
            <DataTable
              columns={columns as any}
              data={filteredInvoices as any}
              onRowClick={(row: any) => router.push(`/billing/${(row as InvoiceRow).id}`)}
            />
          )}
        </div>
      </div>
    </UserLayout>
  );
}

function describeChange(t: string): string {
  const m: Record<string, string> = {
    UPGRADE: '升级',
    DOWNGRADE: '降级',
    CANCEL: '取消',
    REACTIVATE: '恢复',
    SEAT_CHANGE: '席位',
    PLAN_CHANGE: '变更',
    TRIAL_CONVERT: '转化',
  };
  return m[t] || '变更';
}

function cn(...args: any[]): string {
  return args.filter(Boolean).join(' ');
}
