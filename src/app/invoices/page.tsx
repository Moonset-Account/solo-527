'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Download,
  Mail,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Invoice {
  id: string;
  invoiceNumber: string;
  title: string;
  projectId: string;
  totalAmount: number;
  paidAmount: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string | null;
  createdAt: string;
  project?: { name: string };
}

const mockInvoices: Invoice[] = [
  {
    id: 'inv1',
    invoiceNumber: 'INV2024020001',
    title: '官网设计-首付款',
    projectId: 'p1',
    totalAmount: 25000,
    paidAmount: 25000,
    status: 'paid',
    dueDate: '2024-02-15T00:00:00.000Z',
    createdAt: '2024-02-01T00:00:00.000Z',
    project: { name: '官网设计项目' },
  },
  {
    id: 'inv2',
    invoiceNumber: 'INV2024020002',
    title: '品牌VI设计-全款',
    projectId: 'p2',
    totalAmount: 30000,
    paidAmount: 0,
    status: 'sent',
    dueDate: '2024-02-20T00:00:00.000Z',
    createdAt: '2024-02-05T00:00:00.000Z',
    project: { name: '品牌VI设计' },
  },
  {
    id: 'inv3',
    invoiceNumber: 'INV2024010003',
    title: '旧项目收尾款',
    projectId: 'p3',
    totalAmount: 15000,
    paidAmount: 0,
    status: 'overdue',
    dueDate: '2024-01-30T00:00:00.000Z',
    createdAt: '2024-01-15T00:00:00.000Z',
    project: { name: 'Logo设计项目' },
  },
  {
    id: 'inv4',
    invoiceNumber: 'INV2024020004',
    title: '移动App设计-二期款',
    projectId: 'p4',
    totalAmount: 40000,
    paidAmount: 0,
    status: 'draft',
    dueDate: null,
    createdAt: '2024-02-10T00:00:00.000Z',
    project: { name: '移动App设计' },
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: '草稿', color: 'bg-slate-100 text-slate-700', icon: Receipt },
  sent: { label: '已发送', color: 'bg-blue-100 text-blue-700', icon: Send },
  viewed: { label: '已查看', color: 'bg-purple-100 text-purple-700', icon: Clock },
  paid: { label: '已付款', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  overdue: { label: '已逾期', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  cancelled: { label: '已取消', color: 'bg-slate-100 text-slate-500', icon: Receipt },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setInvoices(mockInvoices);
      setIsLoading(false);
    }, 500);
  }, []);

  const totalOutstanding = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);

  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.paidAmount, 0);

  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">发票管理</h1>
          <p className="text-slate-500 mt-1">开具发票、跟踪付款、自动发送提醒</p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            开具发票
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="搜索发票号、标题或项目..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </form>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          筛选
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          导出
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">待收金额</p>
                <p className="text-3xl font-bold text-red-700 mt-1">
                  {formatCurrency(totalOutstanding)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-200/50">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">已收金额</p>
                <p className="text-3xl font-bold text-green-700 mt-1">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-200/50">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">逾期发票</p>
                <p className="text-3xl font-bold text-orange-700 mt-1">{overdueCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-200/50">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : invoices.length > 0 ? (
        <div className="overflow-x-auto">
          <Card>
            <div className="min-w-full divide-y divide-slate-100">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-medium text-slate-500 bg-slate-50/50">
                <div className="col-span-3">发票信息</div>
                <div className="col-span-2">项目</div>
                <div className="col-span-2">金额</div>
                <div className="col-span-2">到期日</div>
                <div className="col-span-2">状态</div>
                <div className="col-span-1 text-right">操作</div>
              </div>

              {invoices.map((invoice, index) => {
                const StatusIcon = statusConfig[invoice.status].icon;
                return (
                  <div
                    key={invoice.id}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors animate-fade-in animate-stagger-${(index % 4) + 1}`}
                  >
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{invoice.title}</p>
                          <p className="text-sm text-slate-500">{invoice.invoiceNumber}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-sm text-slate-600">
                      {invoice.project?.name}
                    </div>
                    <div className="col-span-2">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(invoice.totalAmount)}
                      </p>
                      {invoice.paidAmount > 0 && (
                        <p className="text-xs text-green-600">
                          已付 {formatCurrency(invoice.paidAmount)}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 text-sm text-slate-600">
                      {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[invoice.status].color}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig[invoice.status].label}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end gap-1">
                      {invoice.status === 'draft' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Mail className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <Receipt className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">暂无发票</h3>
            <p className="text-slate-500 mb-6">为已完成的项目开具发票</p>
            <Link href="/invoices/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                开具发票
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
